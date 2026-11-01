const MILLIMETRES = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

export function noseRadiusLabel(radius: number | undefined): string {
  return radius === undefined ? '—' : `${MILLIMETRES.format(radius)}\u00a0mm`;
}
