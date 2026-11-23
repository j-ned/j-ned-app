// Doublure typée : chaque méthode de `T` devient un `jest.Mock` de sa signature exacte. Contrairement
// à `jest.Mocked<T>` (intersection avec `T`), aucune méthode d'origine ne subsiste : passer
// `double.m` à `expect` n'est pas une méthode détachée (`unbound-method`).
export type Stub<T> = {
  -readonly [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.Mock<R, A>
    : T[K];
};

// `jest.fn()` sans paramètre de type rend un mock non typé : celui-ci porte la signature de `F`.
export function stubFn<F extends (...args: never[]) => unknown>(): jest.Mock<
  ReturnType<F>,
  Parameters<F>
> {
  return jest.fn<ReturnType<F>, Parameters<F>>();
}

// Méthode qu'un scénario ne doit jamais atteindre : l'appeler fait échouer le test bruyamment.
export function notStubbed(method: string): () => never {
  return () => {
    throw new Error(`${method} is not stubbed in this test`);
  };
}
