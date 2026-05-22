import { Pipe, PipeTransform } from '@angular/core';

type FrenchDateStyle = 'long' | 'short';

@Pipe({ name: 'frenchDate' })
export class FrenchDatePipe implements PipeTransform {
  transform(dateStr: string | null | undefined, style: FrenchDateStyle = 'long'): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(
      'fr-FR',
      style === 'long'
        ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
    );
  }
}
