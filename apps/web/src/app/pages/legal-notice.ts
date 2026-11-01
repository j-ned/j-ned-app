import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

export const LEGAL_LAST_UPDATE = '20 octobre 2026';

@Component({
  selector: 'app-legal-notice',
  imports: [RouterLink],
  host: { class: 'block min-h-svh pt-20 pb-16' },
  template: `
    <article class="page-container max-w-3xl pt-8 prose dark:prose-invert">
      <h1>Mentions légales</h1>
      <p class="text-muted">Dernière mise à jour&nbsp;: {{ lastUpdate }}</p>

      <h2>Éditeur du site</h2>
      <p data-testid="legal-publisher">
        Ce site personnel, sans activité commerciale, est édité par
        <strong>Julien Nédellec</strong>, particulier, résidant à {{ identity.location }}, France.
      </p>
      <ul>
        <li>
          Courriel&nbsp;:
          <a [href]="'mailto:' + identity.email" data-testid="legal-email">{{ identity.email }}</a>
        </li>
      </ul>
      <p>Directeur de la publication&nbsp;: Julien Nédellec.</p>

      <h2>Hébergement</h2>
      <p data-testid="legal-hosting">
        Le site et son API sont hébergés par l'éditeur lui-même, sur un serveur personnel situé en
        France. L'adresse de contact ci-dessus vaut pour l'hébergeur.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Le code source de ce site est publié sous licence MIT sur
        <a [href]="identity.socials.github" rel="noopener noreferrer" target="_blank">GitHub</a>.
        Les contenus éditoriaux (articles, textes, CV, photographies, visuels et logos) restent la
        propriété exclusive de Julien Nédellec&#8239;; toute reproduction sans autorisation écrite
        est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données collectées par le formulaire de contact, les mesures d'audience et
        les commentaires est décrit dans la
        <a routerLink="/confidentialite">politique de confidentialité</a>.
      </p>
    </article>
  `,
})
export class LegalNotice {
  protected readonly identity = SITE_IDENTITY;
  protected readonly lastUpdate = LEGAL_LAST_UPDATE;
}
