const KIB = 1024;
const MIB = KIB * KIB;

const AT_MOST_ONE_DECIMAL = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
  useGrouping: false,
});

export function formatFileSize(bytes: number): string {
  if (bytes < KIB) return `${bytes} o`;
  const kibibytes = Math.round(bytes / KIB);
  if (kibibytes < KIB) return `${kibibytes} Ko`;
  return `${AT_MOST_ONE_DECIMAL.format(bytes / MIB)} Mo`;
}
