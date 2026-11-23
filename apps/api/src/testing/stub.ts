// Méthode qu'un scénario ne doit jamais atteindre : l'appeler fait échouer le test bruyamment, là où
// une doublure incomplète transtypée aurait levé un `TypeError` anonyme.
export function notStubbed(method: string): () => never {
  return () => {
    throw new Error(`${method} is not stubbed in this test`);
  };
}
