const FR_NUMBER = new Intl.NumberFormat('fr-FR');

export function formatEur(amount: number): string {
  return `${FR_NUMBER.format(amount)}\u00a0€`;
}
