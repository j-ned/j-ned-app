// Un maillon rend le builder (chaînage) ou, configuré en terminator, une promesse.
type MockDbStep = MockDb | Promise<unknown>;
type ChainMock<Args extends unknown[]> = jest.Mock<MockDbStep, Args>;

// Arguments vus comme `unknown` : `mock.calls` est typé, un test qui en attend une forme précise la
// vérifie ou l'affirme.
export interface MockDb {
  readonly select: ChainMock<[fields?: unknown]>;
  readonly from: ChainMock<[table: unknown]>;
  readonly where: ChainMock<[condition: unknown]>;
  readonly orderBy: ChainMock<unknown[]>;
  readonly groupBy: ChainMock<unknown[]>;
  readonly limit: ChainMock<[limit: unknown]>;
  readonly for: ChainMock<[strength: unknown, config?: unknown]>;
  readonly offset: ChainMock<[offset: unknown]>;
  readonly insert: ChainMock<[table: unknown]>;
  readonly values: ChainMock<[values: unknown]>;
  readonly onConflictDoUpdate: ChainMock<[config: unknown]>;
  readonly onConflictDoNothing: ChainMock<[config?: unknown]>;
  readonly update: ChainMock<[table: unknown]>;
  readonly set: ChainMock<[values: unknown]>;
  readonly delete: ChainMock<[table: unknown]>;
  readonly returning: ChainMock<[fields?: unknown]>;
  readonly execute: ChainMock<[query: unknown]>;
  readonly transaction: jest.Mock<
    Promise<unknown>,
    [run: (tx: unknown) => unknown]
  >;
}

const chainMock = <Args extends unknown[]>(): ChainMock<Args> =>
  jest.fn<MockDbStep, Args>();

// Mock chaînable du builder Drizzle : configurer le terminator par test, `db.returning` ou `db.limit`
// (selects sans `.returning()`), avec `mockResolvedValueOnce`.
export function createMockDb(): MockDb {
  const chainable = {
    select: chainMock<[fields?: unknown]>(),
    from: chainMock<[table: unknown]>(),
    where: chainMock<[condition: unknown]>(),
    orderBy: chainMock<unknown[]>(),
    groupBy: chainMock<unknown[]>(),
    limit: chainMock<[limit: unknown]>(),
    for: chainMock<[strength: unknown, config?: unknown]>(),
    offset: chainMock<[offset: unknown]>(),
    insert: chainMock<[table: unknown]>(),
    values: chainMock<[values: unknown]>(),
    onConflictDoUpdate: chainMock<[config: unknown]>(),
    onConflictDoNothing: chainMock<[config?: unknown]>(),
    update: chainMock<[table: unknown]>(),
    set: chainMock<[values: unknown]>(),
    delete: chainMock<[table: unknown]>(),
    returning: chainMock<[fields?: unknown]>(),
    execute: chainMock<[query: unknown]>(),
  };
  const transaction = jest.fn<
    Promise<unknown>,
    [run: (tx: unknown) => unknown]
  >();
  const builder: MockDb = { ...chainable, transaction };
  // Une levée synchrone du callback devient un rejet, comme avec une vraie transaction.
  transaction.mockImplementation(
    (fn) => new Promise((resolve) => resolve(fn(builder))),
  );
  // Chaque méthode retourne le builder lui-même pour permettre le chaînage.
  for (const method of Object.values(chainable)) {
    method.mockReturnValue(builder);
  }
  return builder;
}
