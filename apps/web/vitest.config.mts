import { defineConfig } from 'vitest/config';

// Chargé par le builder `@angular/build:unit-test` via `runnerConfig` (angular.json). Le builder
// fournit lui-même include/plugins/resolve ; on ne fixe ici que ce qu'il laisse au projet.
export default defineConfig({
  test: {
    // Sans cette ligne le builder choisit happy-dom « si résolvable », sinon jsdom : l'environnement
    // dépendrait de l'arbre de dépendances. happy-dom est déclaré en devDependency et fixé ici.
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        settings: {
          // Un <script src> externe (Giscus) ne se charge pas en test : succès silencieux plutôt
          // qu'une DOMException dans la sortie à chaque rendu de BlogComments.
          disableJavaScriptFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
          // Un clic sur un <a href> externe ne déclenche pas de navigation (et donc pas de fetch
          // réseau vers un domaine de test).
          navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true },
        },
      },
    },
  },
});
