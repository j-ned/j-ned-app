import { NotFoundException } from './http-errors';

// Son absence après un `INSERT … RETURNING` serait une anomalie du pilote.
export function insertedRow<T>(rows: readonly T[]): T {
  const [row] = rows;
  if (row === undefined) throw new Error('INSERT … RETURNING returned no row');
  return row;
}

// Absente quand la cible a été supprimée entre la lecture et l'écriture : c'est un 404, pas une
// erreur du serveur.
export function updatedRow<T>(rows: readonly T[], notFound: string): T {
  const [row] = rows;
  if (row === undefined) throw new NotFoundException(notFound);
  return row;
}
