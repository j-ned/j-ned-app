const MILLIMETRES = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

export function noseRadiusLabel(radius: number): string {
  return `${MILLIMETRES.format(radius)}\u00a0mm`;
}
