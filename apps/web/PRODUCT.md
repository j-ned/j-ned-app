# Product

## Register

brand

## Users

Le site est la plateforme d'acquisition client de Julien Nédellec, entrepreneur individuel (SIRET dans `SITE_IDENTITY.business`). Il sert quatre publics. Les trois premiers sont des clients et partagent la home, la navigation et le ton. Le quatrième est secondaire et a sa propre entrée.

**1. Dirigeant de TPE, PME ou artisan (offre site vitrine)** : peu technique, lit souvent sur téléphone. Il veut un prix fixe, un délai et un interlocuteur unique. Ses questions : combien, quand, qu'est-ce que j'obtiens, est-ce sérieux ?

**2. Gérant d'atelier mécanique (offre site atelier)** : sous-cas du public 1. Gérant ou responsable commercial d'un atelier d'usinage, de décolletage ou de mécanique de précision des Yvelines, 5 à 50 salariés. Il arrive par la prospection directe (visite, téléphone, email, LinkedIn), pas par la home. Il attend le vocabulaire de son métier (tolérances, parc machines, EN 9100), pas celui du web.

**3. Responsable métier, fondateur ou CTO (application sur mesure, refonte et maintenance, renfort en régie)** : technique ou semi-technique. Il veut des preuves de livraison en production, une méthode, un cadre clair (devis ferme ou TJM). Il arrive par recommandation, Malt, LinkedIn ou recherche.

**Lecteur associé** : pair tech qui audite le code GitHub pour le compte du public 3.

**4. Recruteur tech (secondaire)** : trouve le parcours, la stack, le CV et la disponibilité CDI sur la page Parcours (bloc « Vous recrutez ? »), accessible depuis le pied de page. Aucun signal de recrutement sur la home ni dans le tunnel de vente.

Le site n'est ni un blog ni un lab. Le blog existe comme preuve de compétence, pas comme produit.

## Product Purpose

Transformer une visite en **demande de devis envoyée**. Le site présente un catalogue de cinq offres à prix ou cadre tarifaire publics, prouve la capacité à livrer en production, et recueille la demande par le formulaire de contact (sujet prérempli depuis chaque page d'offre). Détail : `specs/009-plateforme-acquisition.md`.

| Offre | Public | Tarif |
|---|---|---|
| Site vitrine (TPE, PME, artisans), en ligne en 7 jours | 1 | 890 €, maintenance 29 €/mois |
| Site atelier (mécanique de précision), en ligne en 7 jours | 2 | 690 €, maintenance 29 €/mois |
| Application métier sur mesure | 3 | À partir de 4 500 €, devis ferme après cadrage |
| Refonte, audit et maintenance | 3 | Audit 450 €, maintenance dès 190 €/mois |
| Renfort Angular / NestJS en régie | 3 | TJM sur demande, possible via Malt |

Prix nets, TVA non applicable (art. 293 B du CGI). Les montants vivent dans une source unique du code, jamais en dur dans deux templates.

Succès = un visiteur qui passe d'une page (home, catalogue, offre) au formulaire envoyé, sans appel de qualification préalable. Succès secondaire = un recruteur qui trouve CV et disponibilité en un clic depuis le pied de page.

**Séparation des publics** : l'offre atelier n'apparaît pas sur la home (son public arrive par la prospection) mais figure au catalogue et au pied de page. Le recruteur n'a qu'une entrée, la page Parcours. La voix reste la même partout. Le site ne cite jamais l'employeur de Julien.

## Brand Personality

**Marque** : nom propre, « Julien Nédellec ». Pas de nom de studio.

**Trois mots** : *Rigoureux · Fiable · Soigné*.

- **Rigoureux** : chaque détail est intentionnel (typo, espacement, copy, a11y). Le site est lui-même un échantillon du travail livré.
- **Fiable** : prix annoncé avant de commencer, délai tenu, code et nom de domaine au nom du client, un seul interlocuteur. La confiance vient de faits vérifiables, pas de promesses.
- **Soigné** : éditorial dans la respiration et la typographie, premium dans le rendu (clair et sombre maîtrisés). Le motif visuel vient du dessin technique (cartouche, cotes) : la rigueur d'atelier appliquée au logiciel.

**Voix** : directe, en français, phrases courtes. Vocabulaire du client, pas du développeur : « mis en ligne », pas « déployé » ; « rapide sur téléphone », pas « Lighthouse 98 ». Les termes techniques restent bienvenus pour le public 3, sur ses pages. Aucun superlatif marketing. Aucun em-dash. Le ton dit « je sais ce que je fais, voici ce que vous obtenez ».

**Émotions cibles** : confiance immédiate, sentiment de transparence, envie d'envoyer sa demande maintenant.

## Anti-references

- **Template Bootstrap junior 2018** : hero centré générique, cards alignées avec icône stock, bleu marine + orange. Disqualifie en 2 secondes.
- **Agence web creuse** : « Big hero gradient », faux mockup d'écran, sections « Features », « Get Started », « Solutions innovantes », prix « à partir de » sans détail. Ici on vend par des faits : prix, délai, livrables, déroulé jour par jour.
- **Preuves inventées** : faux témoignages, logos clients sans client, chiffres non vérifiables. Une démo est libellée « Démo ». Un emplacement témoignage n'existe qu'avec un vrai témoignage.
- **Awwwards over-design** : cursor custom, scroll-jacking, intro animée. Le client veut une réponse, pas un spectacle.
- **Jargon développeur sur le chemin client** : commandes shell, noms de frameworks en hero, badges de stack. La stack se montre dans les réalisations et sur la page Parcours.
- **Glassmorphism décoratif partout** : toléré ponctuellement si justifié, jamais comme signature.

## Design Principles

1. **Practice what you preach** : le site doit tenir ce qu'il vend. Lighthouse > 95 partout, a11y WCAG AA strict, SSR et prérendu sans régression, bundle initial minimal. Un prestataire web dont le site est lent perd la vente.

2. **Chaque section répond à une question du client** : dans cet ordre, « qu'est-ce que vous faites ? », « combien et en combien de temps ? », « vous l'avez déjà fait ? », « comment ça se passe ? », « pourquoi vous ? », « comment je vous contacte ? ». Une zone qui n'aide pas à la décision disparaît.

3. **Identité visuelle stable, choix visuels frais** : l'identité indigo + clair/sombre + Tailwind v4 reste le socle. Le motif du dessin technique (cartouche pour les prix et engagements, cotes pour les délais) est la seule signature ajoutée, utilisée avec retenue.

4. **Les faits sont visibles** : prix, délais, livrables, mention TVA, propriété du code et du domaine sont écrits en clair sur chaque offre, jamais cachés derrière « Contactez-nous ».

5. **Zéro friction sur la conversion** : le formulaire est atteignable depuis n'importe quelle page en un clic (bouton d'appel permanent dans le header), sans modal piégeux ni champ superflu. La qualification (type de projet, délai) reste optionnelle.

## Accessibility & Inclusion

- **Cible** : WCAG 2.2 niveau **AA strict**, vérifié en CI via **axe-core** (zéro violation tolérée sur les pages publiques).
- **Lighthouse** : score a11y minimum 95 sur home, catalogue `/offres`, pages d'offre, réalisations, parcours.
- **Navigation clavier** : tous les éléments interactifs atteignables au `Tab`, ordre logique, focus visible non ambigu (`:focus-visible` avec contraste suffisant).
- **Contraste** : 4.5:1 minimum sur texte courant, 3:1 sur composants UI et texte large.
- **Reduced motion** : `prefers-reduced-motion: reduce` respecté — toutes les transitions de route et animations décoratives désactivées.
- **Lecteurs d'écran** : sémantique HTML stricte (`<main>`, `<nav aria-label>`, `<section aria-labelledby>`), landmarks identifiés, `<h1>` unique par page, hiérarchie de headings sans saut.
- **Formulaires** : `<label for>` systématique, `aria-required`, `aria-invalid`, messages d'erreur en `role="alert"`, autofill respecté en dark et light.
- **Daltonisme** : aucune information portée uniquement par la couleur (toujours doublée d'un icône, texte ou pattern).
- **Mobile** : cibles tactiles ≥ 44×44 px, scroll natif (pas de scroll-jacking), zoom utilisateur autorisé.
