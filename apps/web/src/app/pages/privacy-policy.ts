import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { LEGAL_LAST_UPDATE } from './legal-notice';

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    <main class="min-h-svh pt-20 pb-16">
      <article class="page-container max-w-3xl pt-8 prose dark:prose-invert">
        <h1>Politique de confidentialité</h1>
        <p class="text-muted">Dernière mise à jour : {{ lastUpdate }}</p>

        <p>
          Ce site ne dépose aucun cookie de suivi et n'utilise aucun service publicitaire. Voici,
          traitement par traitement, ce qui est collecté, pourquoi, et pour combien de temps. Le
          responsable de ces traitements est Julien Nédellec, joignable à
          <a [href]="'mailto:' + identity.email" data-testid="privacy-email">{{ identity.email }}</a>.
        </p>

        <h2>Formulaire de contact</h2>
        <p>
          Les informations saisies (nom, adresse e-mail, sujet, message) servent uniquement à
          répondre à votre demande. Elles sont enregistrées sur le serveur de l'éditeur et
          transmises par e-mail à l'éditeur ; une confirmation vous est envoyée à l'adresse
          indiquée. Base légale : l'intérêt légitime à répondre à une sollicitation. Elles sont
          conservées le temps du traitement de la demande, puis supprimées par l'éditeur.
        </p>

        <h2>Mesure d'audience</h2>
        <p>
          La fréquentation est mesurée par un outil développé pour ce site, sans cookie ni
          identifiant persistant. Pour chaque page vue sont enregistrés : la page, la provenance
          (nom de domaine du site d'origine uniquement), le pays déduit de l'adresse IP à partir
          d'une base locale, le navigateur et le système d'exploitation, et la durée de visite.
          L'adresse IP n'est jamais conservée : elle sert seulement, combinée au navigateur et à la
          date du jour, à calculer une empreinte non réversible qui distingue les visites d'une même
          journée. Les visites des robots et de l'éditeur sont exclues.
        </p>
        <p>
          Base légale : l'intérêt légitime à connaître l'usage du site. Les données brutes sont
          supprimées après 30 jours ; seuls des totaux journaliers anonymes (visites, pages vues)
          sont conservés au-delà.
        </p>

        <h2>Commentaires des articles</h2>
        <p>
          Les commentaires du blog reposent sur
          <a href="https://giscus.app" rel="noopener noreferrer" target="_blank">Giscus</a>, qui
          les stocke dans les discussions GitHub du dépôt du site. Rien n'est chargé depuis GitHub
          tant que vous n'interagissez pas avec la zone de commentaires ; commenter suppose de vous
          connecter avec votre compte GitHub, dont le traitement relève de la
          <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener noreferrer" target="_blank">politique de confidentialité de GitHub</a>
          (États-Unis).
        </p>

        <h2>Suivi des erreurs techniques</h2>
        <p>
          En cas d'erreur d'affichage, un rapport technique (message d'erreur, page concernée,
          navigateur) est transmis à Sentry, hébergé dans l'Union européenne, pour corriger le
          problème. Aucune donnée d'identification n'y est envoyée volontairement. Ces rapports sont
          conservés 90 jours.
        </p>

        <h2>Stockage local du navigateur</h2>
        <p>
          Le site mémorise dans votre navigateur, sans les transmettre, votre préférence de thème
          (clair ou sombre), les articles que vous avez aimés et, pour l'éditeur uniquement, un
          indice de session et une option d'exclusion des statistiques. Un cookie de session,
          strictement nécessaire, n'est déposé que lors de la connexion à l'espace
          d'administration, réservé à l'éditeur.
        </p>

        <h2>Vos droits</h2>
        <p>
          Vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition sur les
          données qui vous concernent. Pour l'exercer, écrivez à
          <a [href]="'mailto:' + identity.email">{{ identity.email }}</a>. Vous pouvez également
          saisir la
          <a href="https://www.cnil.fr" rel="noopener noreferrer" target="_blank">CNIL</a>.
        </p>

        <p>
          Voir aussi les <a routerLink="/mentions-legales">mentions légales</a>.
        </p>
      </article>
    </main>
  `,
})
export class PrivacyPolicy {
  protected readonly identity = SITE_IDENTITY;
  protected readonly lastUpdate = LEGAL_LAST_UPDATE;
}
