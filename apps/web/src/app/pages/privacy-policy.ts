import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink],
  host: { class: 'block min-h-svh pt-20 pb-16' },
  template: `
    <article class="page-container max-w-3xl pt-8 prose dark:prose-invert">
      <h1>Politique de confidentialité</h1>
      <p class="text-muted" data-testid="privacy-last-update">
        Dernière mise à jour&nbsp;: 10 octobre 2026
      </p>

      <p>
        Ce site ne dépose aucun cookie de suivi et n'utilise aucun service publicitaire. Voici,
        traitement par traitement, ce qui est collecté, pourquoi, et pour combien de temps. Le
        responsable de ces traitements est Julien Nédellec, joignable à
        <a [href]="'mailto:' + identity.email" data-testid="privacy-email">{{ identity.email }}</a
        >.
      </p>

      <h2>Formulaire de contact</h2>
      <p>
        Les informations saisies (nom, adresse e-mail, sujet, message) servent uniquement à répondre
        à votre demande. Elles sont enregistrées sur le serveur de l'éditeur et transmises par
        e-mail à l'éditeur&#8239;; une confirmation vous est envoyée à l'adresse indiquée. Base
        légale&nbsp;: l'intérêt légitime à répondre à une sollicitation. Elles sont conservées le
        temps du traitement de la demande, puis supprimées par l'éditeur.
      </p>

      <h2>Mesure d'audience</h2>
      <p data-testid="privacy-audience-pages">
        La fréquentation est mesurée par un outil développé pour ce site, sans cookie ni identifiant
        persistant. Pour chaque page vue sont enregistrés&nbsp;: la page (sans l'ancre éventuelle),
        la provenance (nom de domaine du site d'origine uniquement, une fois par visite), le pays
        déduit de l'adresse IP à partir d'une base locale, le navigateur, le système d'exploitation
        et le temps d'affichage de la page. L'adresse IP n'est jamais conservée&nbsp;: elle sert
        seulement, combinée au navigateur et à la date du jour, à calculer une empreinte non
        réversible qui distingue les visites d'une même journée. Les visites des robots et de
        l'éditeur sont exclues.
      </p>
      <p data-testid="privacy-audience-actions">
        Certaines actions sont aussi comptées&nbsp;: le clic sur un bouton d'appel, sur un lien de
        contact (e-mail, téléphone, Malt, Discord), de profil (LinkedIn, GitHub) ou de
        démonstration, l'arrivée sur le formulaire de l'accueil, l'envoi réussi du formulaire, le
        téléchargement du CV, l'ouverture et la lecture complète d'un article. Seuls le type
        d'action, son emplacement et la page sont enregistrés, jamais le contenu du formulaire ni
        l'adresse du lien.
      </p>
      <p data-testid="privacy-audience-retention">
        Base légale&nbsp;: l'intérêt légitime à connaître l'usage du site. Les données brutes sont
        supprimées après 30 jours&#8239;; seuls des totaux journaliers anonymes (visites, pages
        vues, visites engagées, rebonds, durée d'affichage cumulée, nombre d'actions par type) sont
        conservés au-delà.
      </p>

      <h2>Commentaires des articles</h2>
      <p>
        Les commentaires du blog reposent sur
        <a href="https://giscus.app" rel="noopener noreferrer" target="_blank">Giscus</a>, qui les
        stocke dans les discussions GitHub du dépôt du site. Rien n'est chargé depuis GitHub tant
        que vous n'interagissez pas avec la zone de commentaires&#8239;; commenter suppose de vous
        connecter avec votre compte GitHub, dont le traitement relève de la
        <a
          href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement"
          rel="noopener noreferrer"
          target="_blank"
          >politique de confidentialité de GitHub</a
        >
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
        (clair ou sombre), les articles que vous avez aimés et, pour l'éditeur uniquement, un indice
        de session et une option d'exclusion des statistiques. Un cookie de session, strictement
        nécessaire, n'est déposé que lors de la connexion à l'espace d'administration, réservé à
        l'éditeur.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition sur les
        données qui vous concernent. Pour l'exercer, écrivez à
        <a [href]="'mailto:' + identity.email">{{ identity.email }}</a
        >. Vous pouvez également saisir la
        <a href="https://www.cnil.fr" rel="noopener noreferrer" target="_blank">CNIL</a>.
      </p>

      <p>Voir aussi les <a routerLink="/mentions-legales">mentions légales</a>.</p>
    </article>
  `,
})
export class PrivacyPolicy {
  protected readonly identity = SITE_IDENTITY;
}
