# ADR-0032 — Contenu d'atelier : une confidentialité vérifiable, sans écrire dans le dépôt ce qu'elle protège

- **Statut** : proposé (2026-10-22, plan technique du volet V1 de la spec 032)
- **Date** : 2026-10-22
- **Contexte spec** : `specs/032-atelier.md` (exigence commune 2, exigence V1 6)
- **Prolonge** : ADR-0007 (images statiques versionnées), ADR-0011 (catalogue de tags, pour le volet V2)
- **Préserve** : ADR-0024 (une page dont le contenu est écrit dans le code est prérendue)

## Context

La spec 032 donne une place au métier de Julien, tourneur CN dans l'aéronautique, en quatre volets
(page, rubrique du blog, calculateur, pont usinage ↔ code). Le secteur est soumis à des clauses de
confidentialité et à des contrôles d'export : rien ne doit exposer l'employeur, ses clients, ses
pièces ou ses plans. Une fuite ne se rattrape pas : une page publique est indexée, mise en cache
(nginx, copies périmées servies en panne, ADR-0024 §3) et archivée par des tiers, et le dépôt du site
est public sur GitHub (mentions légales, licence MIT), historique compris.

Faits vérifiés (2026-10-22) :

- Le dépôt a déjà un verrou éditorial mécanique (`editorial-identity.spec.ts`) : formulations
  interdites (`FORBIDDEN_WORDINGS`, reprises en avertissements dans l'admin par
  `profile-wording-warnings.ts`), vouvoiement, typographie, sur les sources listées dans
  `testing/editorial-sources.ts` et sur tous les fichiers `.ts`/`.html` publics.
- Une liste de noms interdits (employeur, clients, programmes) écrite dans un test serait elle-même
  publiée sur GitHub : le garde-fou exposerait ce qu'il protège.
- Une photo porte souvent des métadonnées (EXIF, XMP : appareil, date, coordonnées GPS) qui situent
  le lieu de prise de vue ; `cwebp` et `avifenc` les recopient selon leurs options.
- Les images statiques de `public/` sont servies avec un cache `immutable` d'un an (ADR-0007) : une
  photo retirée après coup reste chez les visiteurs qui l'ont chargée.

## Decision

1. **Ce qui ne se publie jamais**, quel que soit le volet : le nom de l'employeur ; le nom, le logo ou
   le programme d'un client ; toute référence de pièce, de plan, d'ordre de fabrication ou d'indice ;
   toute photo de pièce (brute, en cours ou finie, même floutée) ; un plan, un écran de commande
   numérique ou un programme ; les données de fabrication réelles d'une pièce (conditions de coupe,
   temps de cycle, cotes) ; tout élément qui situe l'atelier de l'employeur (vue d'ensemble, badge,
   plaque d'inventaire, enseigne) ; les métadonnées d'une photo.
2. **Les photos publiables sont typées** : un sujet fermé (`'personal-tooling' | 'training-workshop' |
   'machine-without-part'`) et la date de la vérification par Julien (`clearedOn`) sont obligatoires
   dans le modèle. Aucun autre sujet ne compile. L'absence de photo est l'état par défaut : la page
   tient sans elle.
3. **Garde mécanique dans le dépôt**, lancée par `pnpm test` (donc par le `pre-commit` et la CI) :
   - une fonction pure `findConfidentialReferences(text)` (domaine de la feature `workshop`) signale
     les motifs de référence : une suite de 5 chiffres ou plus, `P/N`, `PN:`, « réf. pièce / plan /
     client », « plan n° », « n° de plan », « OF n° », « indice » suivi d'une lettre ou d'un chiffre ;
     elle ne signale ni une norme publique (`AS9100`, `EN 9100`, `ISO 2768`), ni une matière
     (`Inconel 718`, `Ti-6Al-4V`, `7075-T6`), ni une cote (`Ø20 ±0,02`), ni une adresse G-code
     (`G71`, `M30`). Elle s'applique à tout le contenu publié de l'atelier ;
   - chaque fichier de `public/workshop/` est exempt de bloc EXIF et XMP ;
   - chaque photo du modèle cite un fichier versionné qui existe (ADR-0007, décision 1).
4. **Ce que la machine ne peut pas vérifier reste humain, et n'est jamais écrit dans le dépôt** : les
   noms de l'employeur et des clients ne figurent dans aucun fichier, test compris. Toute PR qui ajoute
   ou modifie du contenu d'atelier (texte, schéma, photo) porte une liste de vérification
   « confidentialité » que Julien coche lui-même avant le merge ; un agent ne la coche pas.
5. **Portée** : cette règle vaut pour les volets V1 à V4. Le volet V2 (articles de la rubrique
   « Atelier », écrits dans l'admin et lus dans l'API) réutilise `findConfidentialReferences` pour un
   avertissement dans l'éditeur d'article, sur le modèle de `profile-wording-warnings.ts`.

## Consequences

- Une référence de pièce tapée par mégarde casse `pnpm test` avant le commit, pas après la mise en
  ligne. Le motif « 5 chiffres ou plus » interdit aussi un nombre légitime écrit sans espace
  (« 10000 tr/min ») : il s'écrit alors avec l'espace fine insécable de la typographie française
  (« 10 000 »), que le motif ne franchit pas. Un numéro de bloc G-code à 5 chiffres (`N10010`) est
  signalé lui aussi : à traiter au volet V2 si un article en a besoin.
- La garde ne prouve pas l'absence de fuite : elle filtre les maladresses de forme. Le fond (un détail
  qui permet de reconnaître un client) reste la responsabilité de Julien, tracée par la case cochée.
- Une photo exige un travail d'export sans métadonnées (`cwebp -metadata none`, `avifenc` sans
  `--exif`/`--xmp`, ou `exiftool -all=` avant encodage) ; la commande utilisée est notée dans la PR.
- Le jour où l'employeur publie une règle écrite sur l'image, elle prime sur cet ADR, qui est amendé.

## Alternatives considered

- **Liste des noms interdits dans le dépôt** (employeur, clients) : garde exhaustive sur ces noms,
  mais elle publie sur GitHub précisément ce qu'elle protège. Rejetée.
- **Liste de noms hors dépôt** (fichier local ignoré par git, lu par un script) : rien ne garantit
  qu'elle existe sur la machine de la CI ni qu'elle est à jour ; un contrôle qui passe en silence quand
  sa liste manque donne une fausse assurance. Laissée à Julien comme outil personnel, hors gates.
- **Floutage des éléments sensibles sur les photos** : réversible ou mal fait (reflets, bords, plaques
  hors champ), et il signale qu'il y avait quelque chose à cacher. Rejeté : on ne photographie pas ce
  qui ne se publie pas.
- **Aucune photo du tout** : le plus sûr, retenu comme état par défaut ; une photo reste possible si
  Julien a le droit de la publier et que son sujet entre dans la liste fermée.
- **Contenu de l'atelier dans l'API et l'admin** (comme le parcours, ADR-0023) : une écriture en un
  clic, sans revue ni test avant publication. Rejeté pour V1 : le contenu change rarement et chaque
  changement doit passer la garde et la case de Julien, ce qu'un commit garantit et un formulaire non.
