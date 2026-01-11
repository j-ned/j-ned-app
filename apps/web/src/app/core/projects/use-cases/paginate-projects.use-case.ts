import { computed, Injectable, type Signal } from '@angular/core';
import type { Project } from '../models';

@Injectable()
export class PaginateProjectsUseCase {
  execute(
    projects: Signal<readonly Project[]>,
    currentPage: Signal<number>,
    itemsPerPage: number,
  ): Signal<readonly Project[]> {
    return computed(() => {
      const startIndex = (currentPage() - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return projects().slice(startIndex, endIndex);
    });
  }

  calculateTotalPages(totalItems: Signal<number>, itemsPerPage: number): Signal<number> {
    return computed(() => Math.ceil(totalItems() / itemsPerPage));
  }
}
