import { computed, Injectable, type Signal } from '@angular/core';
import type { Project } from '../models';

@Injectable()
export class FilterProjectsUseCase {
  execute(projects: Signal<readonly Project[]>, category: Signal<string>): Signal<readonly Project[]> {
    return computed(() => {
      const activeCategory = category();
      if (activeCategory === 'Tous') {
        return projects();
      }
      return projects().filter((p) => p.category === activeCategory);
    });
  }
}
