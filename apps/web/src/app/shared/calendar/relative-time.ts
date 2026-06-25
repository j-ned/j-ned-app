import { Pipe, type PipeTransform } from '@angular/core';

export function relativeTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - target.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 30) return `${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mois`;
  return target.toLocaleDateString('fr-FR');
}

@Pipe({ name: 'relativeTime' })
export class RelativeTime implements PipeTransform {
  transform(date: Date | string | null | undefined): string {
    if (!date) return '';
    return relativeTime(date);
  }
}
