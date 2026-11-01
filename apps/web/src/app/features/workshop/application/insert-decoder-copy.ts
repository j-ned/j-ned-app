export const INSERT_DECODER_COPY = {
  heading: 'Décodeur de plaquette',
  lead: "Tape le code ISO d'une plaquette de tournage\u00a0: je t'explique chaque lettre et chaque chiffre, position par position.",
  codeLabel: 'Code de plaquette',
  codeListLabel: 'Codes du guide',
  codeHint:
    'Majuscules, espaces et tirets au choix\u00a0: CNMG 120408, cnmg120408, CNMG 120408-PM.',
  submit: 'Décoder',
  resultHeading: 'Décodage de',
  sourcesLabel: 'Sources',
  suffixLabel: 'Suite propre au fabricant',
  suffixMeaning:
    'Brise-copeaux, nuance ou option du fabricant\u00a0: chacun a les siens, je ne la décode pas.',
  sourcesNote:
    "Positions 1 à 7\u00a0: système de l'ISO 1832, d'après Mitsubishi Materials et Kyocera, retenu seulement là où les deux concordent. Je n'ai pas lu la norme, qui est payante.",
} as const;
