import {
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { defer, finalize, type Observable } from 'rxjs';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { moveGalleryImage } from '@features/projects/domain/move-gallery-image';
import type { ProjectImage } from '@features/projects/domain/models/project.model';
import { ToastStore } from '@shared/ui/toast-store';
import { AdminGalleryImageItem } from './admin-gallery-image-item';
import { AdminGalleryUploadForm } from './admin-gallery-upload-form';

const GALLERY_MAX = 12;
const GALLERY_FULL_NOTICE = `${GALLERY_MAX} captures au plus\u00a0: supprimez-en une pour en ajouter une autre.`;

const UPLOAD_ERRORS: Readonly<Record<number, string>> = {
  413: "L'image dépasse 5 Mo.",
  422: 'Image refusée\u00a0: format non pris en charge, ou galerie déjà complète.',
};

const uploadErrorDetail = (error: unknown): string =>
  (error instanceof HttpErrorResponse && UPLOAD_ERRORS[error.status]) ||
  "Erreur lors de l'ajout de la capture";

@Component({
  selector: 'app-admin-project-gallery',
  imports: [AdminGalleryImageItem, AdminGalleryUploadForm],
  host: {
    class: '@container block space-y-4.5',
    'data-testid': 'admin-project-gallery',
  },
  template: `
    <ul
      data-testid="admin-gallery-list"
      role="list"
      class="grid grid-cols-1 gap-4.5 @min-[26rem]:grid-cols-2 @min-[36rem]:grid-cols-3"
    >
      @for (image of gallery(); track image.id; let index = $index, count = $count) {
        <li class="min-w-0">
          <app-admin-gallery-image-item
            [image]="image"
            [rank]="index + 1"
            [total]="count"
            [busy]="pendingImageIds().has(image.id)"
            (altSaved)="saveAlt(image.id, $event)"
            (moveRequested)="move(index, $event)"
            (removeRequested)="remove(image.id)"
          />
        </li>
      }
    </ul>
    @if (isFull()) {
      <p data-testid="admin-gallery-full" class="text-sm text-muted">{{ fullNotice }}</p>
    } @else {
      <app-admin-gallery-upload-form
        [busy]="uploading()"
        [resetToken]="uploadCount()"
        (uploadRequested)="upload($event)"
      />
    }
  `,
})
export class AdminProjectGallery {
  private readonly gateway = inject(ProjectsGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  readonly projectId = input.required<string>();
  readonly images = input.required<readonly ProjectImage[]>();
  readonly galleryChange = output<readonly ProjectImage[]>();

  private readonly items = viewChildren(AdminGalleryImageItem);
  private readonly uploadForm = viewChild(AdminGalleryUploadForm);

  protected readonly gallery = linkedSignal(() => this.images());
  protected readonly isFull = computed(() => this.gallery().length >= GALLERY_MAX);
  protected readonly uploading = signal(false);
  protected readonly uploadCount = signal(0);
  protected readonly pendingImageIds = signal<ReadonlySet<string>>(new Set());
  protected readonly fullNotice = GALLERY_FULL_NOTICE;

  protected upload({ file, alt }: { readonly file: File; readonly alt: string }): void {
    this.uploading.set(true);
    this.write(
      this.gateway
        .uploadGalleryImage(this.projectId(), file, alt)
        .pipe(finalize(() => this.uploading.set(false))),
      (image) => {
        this.commit([...this.gallery(), image]);
        this.uploadCount.update((count) => count + 1);
      },
      uploadErrorDetail,
    );
  }

  protected saveAlt(imageId: string, alt: string): void {
    this.write(
      this.pendingWrite(
        imageId,
        this.gateway.updateGalleryImageAlt(this.projectId(), imageId, alt),
      ),
      (updated) =>
        this.commit(this.gallery().map((image) => (image.id === updated.id ? updated : image))),
      () => "Erreur lors de l'enregistrement du texte alternatif",
    );
  }

  protected move(index: number, delta: -1 | 1): void {
    const ids = this.gallery().map((image) => image.id);
    const movedId = ids[index];
    const focusMoveButton = (): void =>
      this.afterRender(() => this.itemOf(movedId)?.focusMoveButton(delta));
    this.write(
      this.pendingWrite(
        movedId,
        this.gateway.reorderGallery(this.projectId(), moveGalleryImage(ids, index, delta)),
      ),
      (images) => {
        this.commit(images);
        focusMoveButton();
      },
      () => 'Erreur lors du déplacement de la capture',
      focusMoveButton,
    );
  }

  protected remove(imageId: string): void {
    const index = this.gallery().findIndex((image) => image.id === imageId);
    this.write(
      this.pendingWrite(imageId, this.gateway.deleteGalleryImage(this.projectId(), imageId)),
      () => {
        this.commit(this.gallery().filter((image) => image.id !== imageId));
        this.afterRender(() => this.focusAfterRemoval(index));
      },
      () => 'Erreur lors de la suppression de la capture',
      () => this.afterRender(() => this.itemOf(imageId)?.focusConfirmButton()),
    );
  }

  private pendingWrite<T>(imageId: string, request: Observable<T>): Observable<T> {
    return defer(() => {
      this.pendingImageIds.update((ids) => new Set(ids).add(imageId));
      return request.pipe(
        finalize(() =>
          this.pendingImageIds.update((ids) => new Set([...ids].filter((id) => id !== imageId))),
        ),
      );
    });
  }

  private write<T>(
    request: Observable<T>,
    onSuccess: (value: T) => void,
    errorDetail: (error: unknown) => string,
    onError: () => void = () => undefined,
  ): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: onSuccess,
      error: (error: unknown) => {
        this.toast.add({ severity: 'error', detail: errorDetail(error) });
        onError();
      },
    });
  }

  private commit(images: readonly ProjectImage[]): void {
    this.gallery.set(images);
    this.galleryChange.emit(images);
  }

  private focusAfterRemoval(removedIndex: number): void {
    const items = this.items();
    const next = items[Math.min(removedIndex, items.length - 1)];
    if (next) next.focusRemoveButton();
    else this.uploadForm()?.focusAlt();
  }

  private itemOf(imageId: string): AdminGalleryImageItem | undefined {
    return this.items().find((item) => item.image().id === imageId);
  }

  private afterRender(write: () => void): void {
    afterNextRender({ write }, { injector: this.injector });
  }
}
