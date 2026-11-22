type Pager = {
  readonly pageCount: number;
  readonly label: string;
  readonly hasNewer: boolean;
  readonly hasOlder: boolean;
};

// Listes de l'admin servies du plus récent au plus ancien : la page suivante est plus ancienne.
export function pager(total: number, page: number, pageSize: number): Pager {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return {
    pageCount,
    label: `Page ${page} sur ${pageCount}`,
    hasNewer: page > 1,
    hasOlder: page < pageCount,
  };
}
