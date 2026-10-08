import { groupedNumber } from './grouped-number';
import { pluralize } from './pluralize';

export function counted(count: number, singular: string, plural: string): string {
  return `${groupedNumber(count)} ${pluralize(count, singular, plural)}`;
}
