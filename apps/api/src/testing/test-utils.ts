// Mock chaînable du builder Drizzle : configurer le terminator par test, `db.returning` ou `db.limit`
// (selects sans `.returning()`), avec `mockResolvedValueOnce`.
export function createMockDb() {
  const chainable = {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    groupBy: jest.fn(),
    limit: jest.fn(),
    for: jest.fn(),
    offset: jest.fn(),
    insert: jest.fn(),
    values: jest.fn(),
    onConflictDoUpdate: jest.fn(),
    onConflictDoNothing: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    returning: jest.fn(),
    execute: jest.fn(),
  };
  const transaction = jest.fn();
  const builder = { ...chainable, transaction };
  // Une levée synchrone du callback devient un rejet, comme avec une vraie transaction.
  transaction.mockImplementation(
    (fn: (tx: unknown) => unknown) =>
      new Promise((resolve) => resolve(fn(builder))),
  );
  // Chaque méthode retourne le builder lui-même pour permettre le chaînage.
  for (const method of Object.values(chainable)) {
    method.mockReturnValue(builder);
  }
  return builder;
}
