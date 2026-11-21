import { DestroyRef, inject, signal, type WritableResource } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import { resourceValueOr } from '@shared/ui/load-state';

type Identified = { readonly id: string | number };

export class PendingDeletion<T extends Identified> {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _target = signal<T | null>(null);
  readonly target = this._target.asReadonly();

  constructor(
    private readonly _options: {
      readonly list: WritableResource<readonly T[] | undefined>;
      readonly remove: (item: T) => Observable<unknown>;
      readonly succeeded: (item: T) => void;
      readonly failed: (item: T) => void;
    },
  ) {}

  request(item: T): void {
    this._target.set(item);
  }

  cancel(): void {
    this._target.set(null);
  }

  confirm(): void {
    const item = this._target();
    this._target.set(null);
    if (item) this.delete(item);
  }

  // Un échec ne remet que l'élément concerné : une autre suppression acquittée entre-temps tient.
  delete(item: T): void {
    const { list, remove, succeeded, failed } = this._options;
    const before = resourceValueOr(list, []);
    const index = before.findIndex((entry) => entry.id === item.id);
    const removed: T | undefined = before[index];
    const followers = new Set(before.slice(index + 1).map((entry) => entry.id));
    list.update((current) => (current ?? []).filter((entry) => entry.id !== item.id));

    remove(item)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => succeeded(item),
        error: () => {
          if (removed) list.update((current) => reinsert(current ?? [], removed, followers));
          failed(item);
        },
      });
  }
}

function reinsert<T extends Identified>(
  list: readonly T[],
  item: T,
  followers: ReadonlySet<T['id']>,
): readonly T[] {
  if (list.some((entry) => entry.id === item.id)) return list;
  const at = list.findIndex((entry) => followers.has(entry.id));
  return at === -1 ? [...list, item] : [...list.slice(0, at), item, ...list.slice(at)];
}
