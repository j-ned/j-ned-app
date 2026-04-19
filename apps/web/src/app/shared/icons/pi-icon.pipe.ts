import { Pipe, PipeTransform } from '@angular/core';
import { toPrimeIcon } from './icon-map';

@Pipe({ name: 'piIcon' })
export class PiIconPipe implements PipeTransform {
  transform(token: string | null | undefined): string {
    if (!token) return 'pi';
    return `pi ${toPrimeIcon(token)}`;
  }
}
