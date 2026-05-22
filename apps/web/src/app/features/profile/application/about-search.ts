import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { GetWhatISeekUseCase } from '@features/profile/domain';
import { AppIcon } from '@shared/icons';

@Component({
  selector: 'app-about-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  host: { class: 'block' },
  template: `
    <section
      class="bg-linear-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-6 shadow-lg"
    >
      <div class="flex items-center gap-2 mb-4">
        <app-icon name="compass" [size]="20" class="text-accent" />
        <h2 class="font-bold text-2xl text-foreground">{{ whatISeek()?.title }}</h2>
      </div>
      <p class="text-muted text-sm leading-relaxed">
        {{ whatISeek()?.description }}
      </p>
    </section>
  `,
})
export class AboutSearch {
  private readonly _getWhatISeek = inject(GetWhatISeekUseCase);

  private readonly whatISeekResource = rxResource({
    stream: () => this._getWhatISeek.execute(),
  });
  protected readonly whatISeek = computed(() => this.whatISeekResource.value());
}
