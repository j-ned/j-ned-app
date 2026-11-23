// Méthode qu'un scénario ne doit jamais atteindre : son appel lève une erreur qui la nomme (un 500 si
// une route l'intercepte).
export function notStubbed(method: string): () => never {
  return () => {
    throw new Error(`${method} is not stubbed in this test`);
  };
}
