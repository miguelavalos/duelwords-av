export type CommercialLocale = 'en' | 'es' | 'ca' | 'fr' | 'de';

export type SiteEnvironment = 'preview' | 'production';

type CommercialCopy = {
  htmlLang: string;
  languageName: string;
  metaDescription: string;
  nav: {
    how: string;
    modes: string;
    avi: string;
    languages: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    availability: string;
    primaryCta: string;
    secondaryCta: string;
    playerOne: string;
    playerTwo: string;
    sharedWord: string;
    attempts: string;
  };
  how: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: { title: string; body: string }[];
  };
  modes: {
    eyebrow: string;
    title: string;
    lead: string;
    connected: string;
    local: string;
    cards: { number: string; title: string; body: string; kind: 'connected' | 'local' }[];
  };
  trust: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
  };
  avi: {
    eyebrow: string;
    title: string;
    body: string;
    note: string;
  };
  languages: {
    eyebrow: string;
    title: string;
    lead: string;
    note: string;
  };
  closing: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    sourceCta: string;
  };
  footer: {
    product: string;
    privacy: string;
    terms: string;
    support: string;
    deleteAccount: string;
    notices: string;
    appsAv: string;
  };
};

const brandLogo = 'https://cdn.avalsys.com/apps-av/duelwords-av/web-v1/duelwords-av-logo-20260728.webp';
const brandLogoDark = 'https://cdn.avalsys.com/apps-av/duelwords-av/web-v1/duelwords-av-logo-dark-20260728.webp';

const localePaths: Record<CommercialLocale, string> = {
  en: '/',
  es: '/es/',
  ca: '/ca/',
  fr: '/fr/',
  de: '/de/',
};

const copies: Record<CommercialLocale, CommercialCopy> = {
  en: {
    htmlLang: 'en',
    languageName: 'English',
    metaDescription: 'DuelWords AV is a fair five-letter word duel for iPhone and iPad, with Daily, friend challenges, Avi, practice, and five languages.',
    nav: {
      how: 'How it plays',
      modes: 'Game modes',
      avi: 'Meet Avi',
      languages: 'Languages',
    },
    hero: {
      eyebrow: 'The next game from Apps AV',
      title: 'One word. Two paths. A fair duel.',
      lead: 'Solve the same five-letter word and compare how you got there. Play the official Daily, challenge a friend, face Avi, or practise at your own pace.',
      availability: 'Coming next to iPhone and iPad. No ads in V1.',
      primaryCta: 'See how it plays',
      secondaryCta: 'Explore Apps AV',
      playerOne: 'Player one',
      playerTwo: 'Player two',
      sharedWord: 'Same word',
      attempts: 'attempts',
    },
    how: {
      eyebrow: 'How it plays',
      title: 'The same puzzle. Your own strategy.',
      lead: 'DuelWords is about the route as much as the result: every guess leaves a clear trail you can compare when the duel ends.',
      steps: [
        { title: 'Find the word', body: 'Use each five-letter guess to narrow the possibilities. Clear feedback keeps the rules easy to read.' },
        { title: 'Compare the paths', body: 'Both players solve the same target. When the duel closes, see where your approaches matched and diverged.' },
        { title: 'Come back tomorrow', body: 'The Official Daily gives everyone a shared puzzle, while local modes remain ready whenever you are.' },
      ],
    },
    modes: {
      eyebrow: 'Four ways to play',
      title: 'Choose the duel that fits the moment.',
      lead: 'Start with the Daily, send a private challenge, train with Avi, or explore without pressure.',
      connected: 'Connected',
      local: 'On device',
      cards: [
        { number: '01', title: 'Official Daily', body: 'One shared word each day, with a result designed to be compared fairly.', kind: 'connected' },
        { number: '02', title: 'Challenge a Friend', body: 'Send a private invitation and solve the same word on your own schedule.', kind: 'connected' },
        { number: '03', title: 'Play Avi', body: 'Face the Apps AV companion in a bounded word duel that stays focused on the game.', kind: 'local' },
        { number: '04', title: 'Practice', body: 'Play locally, test ideas, and learn the rhythm without an account or a live opponent.', kind: 'local' },
      ],
    },
    trust: {
      eyebrow: 'Designed for fair play',
      title: 'A word game that respects your time.',
      lead: 'The first release keeps the product deliberately focused: a clear duel, a calm interface, and no advertising layer.',
      items: [
        { title: 'Guest first', body: 'Practice and Play Avi work without an account. Sign in only when a connected mode needs a stable identity.' },
        { title: 'Local by default', body: 'Word lists, local play, and most board state stay on your device. Connected games send only the state they need.' },
        { title: 'No ads in V1', body: 'No advertising, no cross-app tracking, and no attention traps between one guess and the next.' },
      ],
    },
    avi: {
      eyebrow: 'Meet Avi',
      title: 'A familiar opponent, with clear boundaries.',
      body: 'Avi joins DuelWords as a playful local opponent and guide. It can keep a practice duel lively without turning the game into an open-ended chat or requiring a connection.',
      note: 'Available in Play Avi and in small, purposeful moments across the app.',
    },
    languages: {
      eyebrow: 'Five languages',
      title: 'Choose the words you think in.',
      lead: 'Play in English, Spanish, Catalan, French, or German. Each language uses its own curated five-letter data and keyboard-tolerant rules.',
      note: 'English · Español · Català · Français · Deutsch',
    },
    closing: {
      eyebrow: 'Coming next',
      title: 'Ready when the next word lands.',
      body: 'DuelWords AV is the next Apps AV release for iPhone and iPad. Until launch, explore the family and follow the public source.',
      primaryCta: 'Explore Apps AV',
      sourceCta: 'View on GitHub',
    },
    footer: {
      product: 'DuelWords AV',
      privacy: 'Privacy',
      terms: 'Terms',
      support: 'Support',
      deleteAccount: 'Delete account',
      notices: 'Notices',
      appsAv: 'Apps AV',
    },
  },
  es: {
    htmlLang: 'es',
    languageName: 'Español',
    metaDescription: 'DuelWords AV es un duelo justo de palabras de cinco letras para iPhone y iPad, con reto diario, amigos, Avi, práctica y cinco idiomas.',
    nav: {
      how: 'Cómo se juega',
      modes: 'Modos de juego',
      avi: 'Conoce a Avi',
      languages: 'Idiomas',
    },
    hero: {
      eyebrow: 'El próximo juego de Apps AV',
      title: 'Una palabra. Dos caminos. Un duelo justo.',
      lead: 'Resuelve la misma palabra de cinco letras y compara cómo habéis llegado. Juega el reto diario oficial, desafía a un amigo, enfréntate a Avi o practica a tu ritmo.',
      availability: 'Próximamente en iPhone y iPad. Sin anuncios en V1.',
      primaryCta: 'Descubre cómo se juega',
      secondaryCta: 'Explora Apps AV',
      playerOne: 'Jugador uno',
      playerTwo: 'Jugador dos',
      sharedWord: 'Misma palabra',
      attempts: 'intentos',
    },
    how: {
      eyebrow: 'Cómo se juega',
      title: 'El mismo reto. Tu propia estrategia.',
      lead: 'En DuelWords importa tanto el recorrido como el resultado: cada intento deja una pista clara que podréis comparar al terminar el duelo.',
      steps: [
        { title: 'Encuentra la palabra', body: 'Usa cada intento de cinco letras para reducir las posibilidades. Las pistas mantienen las reglas claras.' },
        { title: 'Compara los caminos', body: 'Ambos jugadores resuelven el mismo objetivo. Al terminar, descubre dónde coinciden y divergen vuestras estrategias.' },
        { title: 'Vuelve mañana', body: 'El reto diario oficial propone una palabra compartida; los modos locales están disponibles cuando quieras.' },
      ],
    },
    modes: {
      eyebrow: 'Cuatro formas de jugar',
      title: 'Elige el duelo que encaja con el momento.',
      lead: 'Empieza con el reto diario, envía una invitación privada, entrena con Avi o explora sin presión.',
      connected: 'Con conexión',
      local: 'En el dispositivo',
      cards: [
        { number: '01', title: 'Reto diario oficial', body: 'Una palabra compartida cada día, con un resultado pensado para comparar de forma justa.', kind: 'connected' },
        { number: '02', title: 'Desafía a un amigo', body: 'Envía una invitación privada y resolved la misma palabra cada uno a vuestro ritmo.', kind: 'connected' },
        { number: '03', title: 'Juega contra Avi', body: 'Enfréntate al compañero de Apps AV en un duelo acotado y centrado en el juego.', kind: 'local' },
        { number: '04', title: 'Práctica', body: 'Juega en local, prueba ideas y aprende el ritmo sin cuenta ni oponente en directo.', kind: 'local' },
      ],
    },
    trust: {
      eyebrow: 'Diseñado para jugar limpio',
      title: 'Un juego de palabras que respeta tu tiempo.',
      lead: 'La primera versión mantiene el producto deliberadamente enfocado: un duelo claro, una interfaz tranquila y ninguna capa publicitaria.',
      items: [
        { title: 'Primero como invitado', body: 'Práctica y Juega contra Avi funcionan sin cuenta. Inicia sesión solo cuando un modo conectado necesite una identidad estable.' },
        { title: 'Local por defecto', body: 'Las listas de palabras, el juego local y la mayor parte del tablero permanecen en tu dispositivo.' },
        { title: 'Sin anuncios en V1', body: 'Sin publicidad, seguimiento entre apps ni trampas de atención entre un intento y el siguiente.' },
      ],
    },
    avi: {
      eyebrow: 'Conoce a Avi',
      title: 'Un oponente familiar, con límites claros.',
      body: 'Avi llega a DuelWords como oponente local y guía. Puede animar una partida de práctica sin convertir el juego en un chat abierto ni exigir conexión.',
      note: 'Disponible en Juega contra Avi y en pequeños momentos útiles dentro de la app.',
    },
    languages: {
      eyebrow: 'Cinco idiomas',
      title: 'Elige las palabras con las que piensas.',
      lead: 'Juega en inglés, español, catalán, francés o alemán. Cada idioma utiliza datos propios de cinco letras y reglas tolerantes con el teclado.',
      note: 'English · Español · Català · Français · Deutsch',
    },
    closing: {
      eyebrow: 'Próximamente',
      title: 'Listo cuando llegue la siguiente palabra.',
      body: 'DuelWords AV será el próximo lanzamiento de Apps AV para iPhone y iPad. Hasta entonces, explora la familia y sigue el código público.',
      primaryCta: 'Explora Apps AV',
      sourceCta: 'Ver en GitHub',
    },
    footer: {
      product: 'DuelWords AV',
      privacy: 'Privacidad',
      terms: 'Condiciones',
      support: 'Soporte',
      deleteAccount: 'Eliminar cuenta',
      notices: 'Avisos',
      appsAv: 'Apps AV',
    },
  },
  ca: {
    htmlLang: 'ca',
    languageName: 'Català',
    metaDescription: 'DuelWords AV és un duel just de paraules de cinc lletres per a iPhone i iPad, amb repte diari, amics, Avi, pràctica i cinc idiomes.',
    nav: {
      how: 'Com es juga',
      modes: 'Modes de joc',
      avi: 'Coneix l’Avi',
      languages: 'Idiomes',
    },
    hero: {
      eyebrow: 'El pròxim joc d’Apps AV',
      title: 'Una paraula. Dos camins. Un duel just.',
      lead: 'Resol la mateixa paraula de cinc lletres i compara com hi heu arribat. Juga el repte diari oficial, desafia una amistat, enfronta’t a l’Avi o practica al teu ritme.',
      availability: 'Pròximament a iPhone i iPad. Sense anuncis a la V1.',
      primaryCta: 'Descobreix com es juga',
      secondaryCta: 'Explora Apps AV',
      playerOne: 'Jugador u',
      playerTwo: 'Jugador dos',
      sharedWord: 'La mateixa paraula',
      attempts: 'intents',
    },
    how: {
      eyebrow: 'Com es juga',
      title: 'El mateix repte. La teva estratègia.',
      lead: 'A DuelWords importa tant el recorregut com el resultat: cada intent deixa un rastre clar que podreu comparar quan acabi el duel.',
      steps: [
        { title: 'Troba la paraula', body: 'Fes servir cada intent de cinc lletres per reduir les possibilitats. Les pistes fan que les regles siguin clares.' },
        { title: 'Compara els camins', body: 'Tots dos jugadors resolen el mateix objectiu. Al final, veureu on coincideixen i divergeixen les estratègies.' },
        { title: 'Torna demà', body: 'El repte diari oficial proposa una paraula compartida; els modes locals estan preparats quan vulguis.' },
      ],
    },
    modes: {
      eyebrow: 'Quatre maneres de jugar',
      title: 'Tria el duel que encaixa amb el moment.',
      lead: 'Comença amb el repte diari, envia una invitació privada, entrena amb l’Avi o explora sense pressió.',
      connected: 'Amb connexió',
      local: 'Al dispositiu',
      cards: [
        { number: '01', title: 'Repte diari oficial', body: 'Una paraula compartida cada dia, amb un resultat pensat per comparar de manera justa.', kind: 'connected' },
        { number: '02', title: 'Desafia una amistat', body: 'Envia una invitació privada i resoleu la mateixa paraula cadascú al seu ritme.', kind: 'connected' },
        { number: '03', title: 'Juga contra l’Avi', body: 'Enfronta’t al company d’Apps AV en un duel acotat i centrat en el joc.', kind: 'local' },
        { number: '04', title: 'Pràctica', body: 'Juga en local, prova idees i aprèn el ritme sense compte ni oponent en directe.', kind: 'local' },
      ],
    },
    trust: {
      eyebrow: 'Dissenyat per jugar net',
      title: 'Un joc de paraules que respecta el teu temps.',
      lead: 'La primera versió manté el producte deliberadament enfocat: un duel clar, una interfície tranquil·la i cap capa publicitària.',
      items: [
        { title: 'Primer com a convidat', body: 'Pràctica i Juga contra l’Avi funcionen sense compte. Inicia sessió només quan un mode connectat necessiti una identitat estable.' },
        { title: 'Local per defecte', body: 'Les llistes de paraules, el joc local i la major part del tauler romanen al teu dispositiu.' },
        { title: 'Sense anuncis a la V1', body: 'Sense publicitat, seguiment entre apps ni trampes d’atenció entre un intent i el següent.' },
      ],
    },
    avi: {
      eyebrow: 'Coneix l’Avi',
      title: 'Un oponent familiar, amb límits clars.',
      body: 'L’Avi arriba a DuelWords com a oponent local i guia. Pot animar una partida de pràctica sense convertir el joc en un xat obert ni exigir connexió.',
      note: 'Disponible a Juga contra l’Avi i en petits moments útils dins de l’app.',
    },
    languages: {
      eyebrow: 'Cinc idiomes',
      title: 'Tria les paraules amb què penses.',
      lead: 'Juga en anglès, espanyol, català, francès o alemany. Cada idioma utilitza dades pròpies de cinc lletres i regles tolerants amb el teclat.',
      note: 'English · Español · Català · Français · Deutsch',
    },
    closing: {
      eyebrow: 'Pròximament',
      title: 'A punt quan arribi la paraula següent.',
      body: 'DuelWords AV serà el pròxim llançament d’Apps AV per a iPhone i iPad. Fins aleshores, explora la família i segueix el codi públic.',
      primaryCta: 'Explora Apps AV',
      sourceCta: 'Mostra’l a GitHub',
    },
    footer: {
      product: 'DuelWords AV',
      privacy: 'Privacitat',
      terms: 'Condicions',
      support: 'Suport',
      deleteAccount: 'Elimina el compte',
      notices: 'Avisos',
      appsAv: 'Apps AV',
    },
  },
  fr: {
    htmlLang: 'fr',
    languageName: 'Français',
    metaDescription: 'DuelWords AV est un duel équitable de mots de cinq lettres pour iPhone et iPad, avec défi quotidien, amis, Avi, entraînement et cinq langues.',
    nav: {
      how: 'Comment jouer',
      modes: 'Modes de jeu',
      avi: 'Découvrir Avi',
      languages: 'Langues',
    },
    hero: {
      eyebrow: 'Le prochain jeu d’Apps AV',
      title: 'Un mot. Deux chemins. Un duel équitable.',
      lead: 'Trouvez le même mot de cinq lettres et comparez vos parcours. Jouez au défi quotidien officiel, défiez un ami, affrontez Avi ou entraînez-vous à votre rythme.',
      availability: 'Bientôt sur iPhone et iPad. Sans publicité dans la V1.',
      primaryCta: 'Découvrir le jeu',
      secondaryCta: 'Explorer Apps AV',
      playerOne: 'Joueur un',
      playerTwo: 'Joueur deux',
      sharedWord: 'Même mot',
      attempts: 'essais',
    },
    how: {
      eyebrow: 'Comment jouer',
      title: 'Le même défi. Votre propre stratégie.',
      lead: 'Dans DuelWords, le parcours compte autant que le résultat : chaque essai laisse une trace claire à comparer à la fin du duel.',
      steps: [
        { title: 'Trouvez le mot', body: 'Utilisez chaque essai de cinq lettres pour réduire les possibilités. Les indices rendent les règles faciles à lire.' },
        { title: 'Comparez les parcours', body: 'Les deux joueurs résolvent la même cible. À la fin, découvrez où vos stratégies se rejoignent et divergent.' },
        { title: 'Revenez demain', body: 'Le défi quotidien officiel propose un mot partagé ; les modes locaux restent disponibles à tout moment.' },
      ],
    },
    modes: {
      eyebrow: 'Quatre façons de jouer',
      title: 'Choisissez le duel adapté au moment.',
      lead: 'Commencez par le défi quotidien, envoyez une invitation privée, entraînez-vous avec Avi ou explorez sans pression.',
      connected: 'Connecté',
      local: 'Sur l’appareil',
      cards: [
        { number: '01', title: 'Défi quotidien officiel', body: 'Un mot partagé chaque jour, avec un résultat conçu pour une comparaison équitable.', kind: 'connected' },
        { number: '02', title: 'Défier un ami', body: 'Envoyez une invitation privée et trouvez le même mot, chacun à votre rythme.', kind: 'connected' },
        { number: '03', title: 'Jouer contre Avi', body: 'Affrontez le compagnon d’Apps AV dans un duel encadré et centré sur le jeu.', kind: 'local' },
        { number: '04', title: 'Entraînement', body: 'Jouez en local, testez des idées et apprenez le rythme sans compte ni adversaire en direct.', kind: 'local' },
      ],
    },
    trust: {
      eyebrow: 'Conçu pour le fair-play',
      title: 'Un jeu de mots qui respecte votre temps.',
      lead: 'La première version reste volontairement ciblée : un duel clair, une interface calme et aucune couche publicitaire.',
      items: [
        { title: 'Invité en premier', body: 'Entraînement et Jouer contre Avi fonctionnent sans compte. Connectez-vous uniquement lorsqu’un mode en ligne exige une identité stable.' },
        { title: 'Local par défaut', body: 'Les listes de mots, le jeu local et la majeure partie du plateau restent sur votre appareil.' },
        { title: 'Sans publicité dans la V1', body: 'Aucune publicité, aucun suivi entre applications et aucun piège à attention entre deux essais.' },
      ],
    },
    avi: {
      eyebrow: 'Découvrir Avi',
      title: 'Un adversaire familier, avec des limites claires.',
      body: 'Avi rejoint DuelWords comme adversaire local et guide. Il anime un duel d’entraînement sans transformer le jeu en discussion ouverte ni exiger de connexion.',
      note: 'Disponible dans Jouer contre Avi et lors de petits moments utiles dans l’app.',
    },
    languages: {
      eyebrow: 'Cinq langues',
      title: 'Choisissez les mots dans lesquels vous pensez.',
      lead: 'Jouez en anglais, espagnol, catalan, français ou allemand. Chaque langue possède ses données de cinq lettres et des règles adaptées au clavier.',
      note: 'English · Español · Català · Français · Deutsch',
    },
    closing: {
      eyebrow: 'Bientôt disponible',
      title: 'Prêt pour le prochain mot.',
      body: 'DuelWords AV sera la prochaine sortie d’Apps AV pour iPhone et iPad. D’ici là, explorez la famille et suivez le code public.',
      primaryCta: 'Explorer Apps AV',
      sourceCta: 'Voir sur GitHub',
    },
    footer: {
      product: 'DuelWords AV',
      privacy: 'Confidentialité',
      terms: 'Conditions',
      support: 'Assistance',
      deleteAccount: 'Supprimer le compte',
      notices: 'Mentions',
      appsAv: 'Apps AV',
    },
  },
  de: {
    htmlLang: 'de',
    languageName: 'Deutsch',
    metaDescription: 'DuelWords AV ist ein faires Fünf-Buchstaben-Wortduell für iPhone und iPad – mit Daily, Freundesduellen, Avi, Training und fünf Sprachen.',
    nav: {
      how: 'So wird gespielt',
      modes: 'Spielmodi',
      avi: 'Avi kennenlernen',
      languages: 'Sprachen',
    },
    hero: {
      eyebrow: 'Das nächste Spiel von Apps AV',
      title: 'Ein Wort. Zwei Wege. Ein faires Duell.',
      lead: 'Löst dasselbe Wort mit fünf Buchstaben und vergleicht eure Wege. Spielt das offizielle Daily, fordert Freunde heraus, tretet gegen Avi an oder trainiert in eurem Tempo.',
      availability: 'Demnächst für iPhone und iPad. Keine Werbung in V1.',
      primaryCta: 'So wird gespielt',
      secondaryCta: 'Apps AV entdecken',
      playerOne: 'Spieler eins',
      playerTwo: 'Spieler zwei',
      sharedWord: 'Dasselbe Wort',
      attempts: 'Versuche',
    },
    how: {
      eyebrow: 'So wird gespielt',
      title: 'Dieselbe Aufgabe. Deine eigene Strategie.',
      lead: 'Bei DuelWords zählt der Weg genauso wie das Ergebnis: Jeder Versuch hinterlässt eine klare Spur, die ihr am Ende vergleichen könnt.',
      steps: [
        { title: 'Finde das Wort', body: 'Grenze mit jedem Fünf-Buchstaben-Versuch die Möglichkeiten ein. Klares Feedback macht die Regeln leicht lesbar.' },
        { title: 'Vergleicht eure Wege', body: 'Beide lösen dasselbe Zielwort. Nach dem Duell seht ihr, wo eure Strategien übereinstimmen und abweichen.' },
        { title: 'Komm morgen wieder', body: 'Das offizielle Daily bietet allen ein gemeinsames Rätsel; lokale Modi sind jederzeit bereit.' },
      ],
    },
    modes: {
      eyebrow: 'Vier Arten zu spielen',
      title: 'Wähle das Duell für den richtigen Moment.',
      lead: 'Starte mit dem Daily, sende eine private Einladung, trainiere mit Avi oder probiere ohne Druck.',
      connected: 'Verbunden',
      local: 'Auf dem Gerät',
      cards: [
        { number: '01', title: 'Offizielles Daily', body: 'Jeden Tag ein gemeinsames Wort – mit einem Ergebnis für einen fairen Vergleich.', kind: 'connected' },
        { number: '02', title: 'Freunde herausfordern', body: 'Sende eine private Einladung und löst dasselbe Wort jeweils im eigenen Tempo.', kind: 'connected' },
        { number: '03', title: 'Gegen Avi spielen', body: 'Tritt in einem klar begrenzten, spielbezogenen Wortduell gegen den Apps-AV-Begleiter an.', kind: 'local' },
        { number: '04', title: 'Training', body: 'Spiele lokal, teste Ideen und finde den Rhythmus – ohne Konto oder Live-Gegner.', kind: 'local' },
      ],
    },
    trust: {
      eyebrow: 'Für faires Spielen',
      title: 'Ein Wortspiel, das deine Zeit respektiert.',
      lead: 'Die erste Version bleibt bewusst fokussiert: ein klares Duell, eine ruhige Oberfläche und keine Werbeschicht.',
      items: [
        { title: 'Gast zuerst', body: 'Training und Gegen Avi spielen funktionieren ohne Konto. Melde dich nur an, wenn ein verbundener Modus eine feste Identität benötigt.' },
        { title: 'Standardmäßig lokal', body: 'Wortlisten, lokales Spiel und der größte Teil des Spielstands bleiben auf deinem Gerät.' },
        { title: 'Keine Werbung in V1', body: 'Keine Anzeigen, kein appübergreifendes Tracking und keine Aufmerksamkeitsfallen zwischen zwei Versuchen.' },
      ],
    },
    avi: {
      eyebrow: 'Avi kennenlernen',
      title: 'Ein vertrauter Gegner mit klaren Grenzen.',
      body: 'Avi begleitet DuelWords als lokaler Gegner und Wegweiser. So bleibt ein Trainingsduell lebendig, ohne offenen Chat oder notwendige Verbindung.',
      note: 'Verfügbar in Gegen Avi spielen und in kleinen, gezielten Momenten der App.',
    },
    languages: {
      eyebrow: 'Fünf Sprachen',
      title: 'Wähle die Wörter, in denen du denkst.',
      lead: 'Spiele auf Englisch, Spanisch, Katalanisch, Französisch oder Deutsch. Jede Sprache nutzt eigene kuratierte Fünf-Buchstaben-Daten und tastaturfreundliche Regeln.',
      note: 'English · Español · Català · Français · Deutsch',
    },
    closing: {
      eyebrow: 'Demnächst',
      title: 'Bereit für das nächste Wort.',
      body: 'DuelWords AV wird die nächste Apps-AV-Veröffentlichung für iPhone und iPad. Bis dahin kannst du die Familie und den öffentlichen Quellcode entdecken.',
      primaryCta: 'Apps AV entdecken',
      sourceCta: 'Auf GitHub ansehen',
    },
    footer: {
      product: 'DuelWords AV',
      privacy: 'Datenschutz',
      terms: 'Bedingungen',
      support: 'Support',
      deleteAccount: 'Konto löschen',
      notices: 'Hinweise',
      appsAv: 'Apps AV',
    },
  },
};

export function commercialLocaleForPath(pathname: string): CommercialLocale | null {
  const normalized = pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
  return (Object.entries(localePaths).find(([, path]) => path === normalized)?.[0] as CommercialLocale | undefined) ?? null;
}

export function commercialPage(locale: CommercialLocale, environment: SiteEnvironment): string {
  const copy = copies[locale];
  const canonicalUrl = `https://duelwords-av.avalsys.com${localePaths[locale]}`;
  const appsAvUrl = environment === 'preview'
    ? 'https://apps-av-preview.avalsys.com/'
    : 'https://apps-av.avalsys.com/';

  return `<!doctype html>
<html lang="${copy.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f8f1df" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111715" media="(prefers-color-scheme: dark)">
  <meta name="description" content="${copy.metaDescription}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="DuelWords AV">
  <meta property="og:title" content="${copy.hero.title}">
  <meta property="og:description" content="${copy.metaDescription}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${brandLogo}">
  <link rel="canonical" href="${canonicalUrl}">
  ${languageAlternates()}
  <title>DuelWords AV — ${copy.hero.title}</title>
  <style>${styles}</style>
</head>
<body>
  <header class="site-header">
    ${logo(localePaths[locale], 'DuelWords AV', 'header-logo')}
    <nav class="primary-nav" aria-label="${copy.footer.product}">
      <a href="#how">${copy.nav.how}</a>
      <a href="#modes">${copy.nav.modes}</a>
      <a href="#avi">${copy.nav.avi}</a>
    </nav>
    <nav class="language-nav" aria-label="${copy.nav.languages}">
      ${languageLinks(locale)}
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${copy.hero.eyebrow}</p>
        ${logo(localePaths[locale], 'DuelWords AV', 'hero-logo')}
        <h1>${copy.hero.title}</h1>
        <p class="hero-lead">${copy.hero.lead}</p>
        <p class="availability">${copy.hero.availability}</p>
        <div class="actions">
          <a class="button button-primary" href="#how">${copy.hero.primaryCta}</a>
          <a class="button button-secondary" href="${appsAvUrl}">${copy.hero.secondaryCta}</a>
        </div>
      </div>
      ${duelBoard(copy)}
    </section>

    <section class="section section-how" id="how">
      <div class="section-heading">
        <p class="eyebrow">${copy.how.eyebrow}</p>
        <h2>${copy.how.title}</h2>
        <p>${copy.how.lead}</p>
      </div>
      <ol class="steps">
        ${copy.how.steps.map((step, index) => `<li><span>0${index + 1}</span><div><h3>${step.title}</h3><p>${step.body}</p></div></li>`).join('')}
      </ol>
    </section>

    <section class="section section-modes" id="modes">
      <div class="section-heading">
        <p class="eyebrow">${copy.modes.eyebrow}</p>
        <h2>${copy.modes.title}</h2>
        <p>${copy.modes.lead}</p>
      </div>
      <div class="mode-grid">
        ${copy.modes.cards.map((card) => `<article class="mode-card mode-${card.kind}">
          <div class="mode-meta"><span>${card.number}</span><span>${card.kind === 'connected' ? copy.modes.connected : copy.modes.local}</span></div>
          <h3>${card.title}</h3>
          <p>${card.body}</p>
        </article>`).join('')}
      </div>
    </section>

    <section class="section section-trust">
      <div class="section-heading">
        <p class="eyebrow">${copy.trust.eyebrow}</p>
        <h2>${copy.trust.title}</h2>
        <p>${copy.trust.lead}</p>
      </div>
      <div class="trust-grid">
        ${copy.trust.items.map((item) => `<article><span class="check" aria-hidden="true">✓</span><h3>${item.title}</h3><p>${item.body}</p></article>`).join('')}
      </div>
    </section>

    <section class="section avi-section" id="avi">
      <div class="avi-portrait" aria-hidden="true">
        <div class="avi-antenna"></div><div class="avi-head"><span>•ᴗ•</span></div><div class="avi-body"><span>AV</span></div>
      </div>
      <div class="avi-copy">
        <p class="eyebrow">${copy.avi.eyebrow}</p>
        <h2>${copy.avi.title}</h2>
        <p>${copy.avi.body}</p>
        <p class="note">${copy.avi.note}</p>
      </div>
    </section>

    <section class="section language-section" id="languages">
      <div class="section-heading">
        <p class="eyebrow">${copy.languages.eyebrow}</p>
        <h2>${copy.languages.title}</h2>
        <p>${copy.languages.lead}</p>
      </div>
      <p class="language-list">${copy.languages.note}</p>
    </section>

    <section class="closing">
      <p class="eyebrow">${copy.closing.eyebrow}</p>
      <h2>${copy.closing.title}</h2>
      <p>${copy.closing.body}</p>
      <div class="actions">
        <a class="button button-primary" href="${appsAvUrl}">${copy.closing.primaryCta}</a>
        <a class="button button-secondary" href="https://github.com/miguelavalos/duelwords-av">${copy.closing.sourceCta}</a>
      </div>
    </section>
  </main>

  <footer>
    <div class="footer-brand">
      ${logo(localePaths[locale], 'DuelWords AV', 'footer-logo')}
      <span>An Apps AV product by Avalsys</span>
    </div>
    <nav aria-label="${copy.footer.product}">
      <a href="/privacy/">${copy.footer.privacy}</a>
      <a href="/terms/">${copy.footer.terms}</a>
      <a href="/support/">${copy.footer.support}</a>
      <a href="/delete-account/">${copy.footer.deleteAccount}</a>
      <a href="/notices/">${copy.footer.notices}</a>
      <a href="${appsAvUrl}">${copy.footer.appsAv}</a>
    </nav>
  </footer>
</body>
</html>`;
}

function logo(href: string, label: string, className: string): string {
  return `<a class="${className}" href="${href}" aria-label="${label}">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="${brandLogoDark}">
      <img src="${brandLogo}" alt="${label}" width="1020" height="230">
    </picture>
  </a>`;
}

function languageLinks(current: CommercialLocale): string {
  return (Object.entries(localePaths) as [CommercialLocale, string][])
    .map(([locale, href]) => `<a href="${href}" lang="${copies[locale].htmlLang}" hreflang="${copies[locale].htmlLang}"${locale === current ? ' aria-current="page"' : ''}>${locale.toUpperCase()}</a>`)
    .join('');
}

function languageAlternates(): string {
  const alternates = (Object.entries(localePaths) as [CommercialLocale, string][])
    .map(([locale, path]) => `<link rel="alternate" hreflang="${copies[locale].htmlLang}" href="https://duelwords-av.avalsys.com${path}">`)
    .join('');
  return `${alternates}<link rel="alternate" hreflang="x-default" href="https://duelwords-av.avalsys.com/">`;
}

function duelBoard(copy: CommercialCopy): string {
  return `<div class="duel-board" aria-label="${copy.hero.sharedWord}">
    <div class="board-stitch" aria-hidden="true"></div>
    <div class="board-side">
      <div class="player-label"><span>01</span>${copy.hero.playerOne}</div>
      ${attemptRow(['D', 'U', 'E', 'L', 'S'], ['near', 'near', 'hit', 'miss', 'hit'])}
      ${attemptRow(['D', 'U', 'E', 'L', 'S'], ['hit', 'hit', 'hit', 'hit', 'hit'])}
      <p class="attempt-count">4 ${copy.hero.attempts}</p>
    </div>
    <div class="board-side">
      <div class="player-label"><span>02</span>${copy.hero.playerTwo}</div>
      ${attemptRow(['D', 'U', 'E', 'L', 'S'], ['miss', 'hit', 'near', 'near', 'hit'])}
      ${attemptRow(['D', 'U', 'E', 'L', 'S'], ['hit', 'hit', 'hit', 'hit', 'hit'])}
      <p class="attempt-count">5 ${copy.hero.attempts}</p>
    </div>
    <div class="shared-word"><span>${copy.hero.sharedWord}</span><strong>DUELS</strong></div>
  </div>`;
}

function attemptRow(letters: string[], states: string[]): string {
  return `<div class="attempt-row" aria-hidden="true">${letters.map((letter, index) => `<span class="${states[index]}">${letter}</span>`).join('')}</div>`;
}

const styles = `
:root{color-scheme:light dark;--paper:#f8f1df;--paper-deep:#efe2c8;--surface:#fffaf0;--surface-strong:#fffdf7;--ink:#163b63;--body:#3e4e4a;--muted:#6e776f;--line:#c9b995;--green:#4f9a3c;--green-soft:#dfeccd;--ochre:#c48a39;--terracotta:#aa6043;--shadow:0 24px 60px rgba(54,48,35,.13);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--paper);color:var(--body)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-height:100vh;background:radial-gradient(circle at 82% 5%,rgba(150,188,112,.2) 0,transparent 28rem),radial-gradient(circle at 12% 26%,rgba(212,158,83,.12) 0,transparent 22rem),var(--paper);background-image:radial-gradient(circle at 82% 5%,rgba(150,188,112,.2) 0,transparent 28rem),radial-gradient(circle at 12% 26%,rgba(212,158,83,.12) 0,transparent 22rem),repeating-linear-gradient(0deg,transparent 0,transparent 4px,rgba(49,55,44,.018) 5px),none;color:var(--body)}
a{color:inherit;text-underline-offset:3px}.site-header{position:relative;z-index:5;width:min(calc(100% - 48px),1120px);margin:18px auto 0;padding:14px 18px;display:grid;grid-template-columns:190px 1fr auto;align-items:center;gap:22px;border:1px solid rgba(201,185,149,.68);border-radius:20px;background:color-mix(in srgb,var(--surface-strong) 92%,transparent);box-shadow:0 10px 30px rgba(54,48,35,.07)}
.header-logo,.hero-logo,.footer-logo{display:block;line-height:0}.header-logo img,.hero-logo img,.footer-logo img{display:block;width:100%;height:auto}.primary-nav{display:flex;justify-content:center;gap:4px}.primary-nav a,.language-nav a{padding:9px 11px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:750}.primary-nav a:hover,.primary-nav a:focus-visible,.language-nav a:hover,.language-nav a:focus-visible,.language-nav a[aria-current=page]{background:var(--green-soft);color:#285c2c;outline:none}.language-nav{display:flex;gap:1px}.language-nav a{padding-inline:7px;font-size:11px;letter-spacing:.05em}
main{overflow:hidden}.hero{width:min(calc(100% - 48px),1120px);margin:0 auto;padding:76px 0 90px;display:grid;grid-template-columns:minmax(0,.92fr) minmax(420px,1.08fr);align-items:center;gap:70px}.hero-copy{min-width:0}.eyebrow{margin:0 0 14px;color:var(--green);font-size:12px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.hero-logo{width:min(100%,440px);margin:0 0 32px}h1,h2,h3,p{overflow-wrap:break-word}h1,h2,h3{color:var(--ink)}h1{max-width:10ch;margin:0;font-size:clamp(52px,6vw,78px);line-height:.98;letter-spacing:-.055em}h2{max-width:14ch;margin:0;font-size:clamp(40px,5vw,62px);line-height:1.02;letter-spacing:-.045em}h3{margin:0;font-size:22px;line-height:1.18;letter-spacing:-.02em}.hero-lead{max-width:58ch;margin:26px 0 0;font-size:19px;line-height:1.65}.availability{margin:22px 0 0;color:var(--green);font-size:14px;font-weight:800}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.button{display:inline-flex;min-height:48px;align-items:center;justify-content:center;padding:13px 19px;border:1px solid var(--ink);border-radius:14px;text-decoration:none;font-weight:800;transition:transform .16s ease,box-shadow .16s ease,background .16s ease}.button:hover,.button:focus-visible{transform:translateY(-2px);outline:none;box-shadow:0 9px 18px rgba(30,54,61,.13)}.button-primary{background:var(--ink);color:#fffdf5}.button-secondary{background:color-mix(in srgb,var(--surface) 80%,transparent);color:var(--ink)}
.duel-board{position:relative;min-height:520px;padding:52px 42px 110px;display:grid;grid-template-columns:1fr 1fr;gap:46px;border:1px solid #b9a477;border-radius:28px;background:linear-gradient(90deg,#fff9e9 0,#f9eed7 49.5%,#efe0c4 50%,#fff9e9 51%);box-shadow:var(--shadow);transform:rotate(1deg)}.duel-board:before{content:"";position:absolute;inset:12px;border:1px solid rgba(122,101,64,.3);border-radius:20px;pointer-events:none}.duel-board:after{content:"";position:absolute;inset:0;border-radius:28px;background:repeating-linear-gradient(0deg,transparent 0,transparent 29px,rgba(61,92,108,.08) 30px);pointer-events:none}.board-stitch{position:absolute;z-index:2;left:50%;top:23px;bottom:23px;border-left:2px dashed rgba(98,79,48,.32)}.board-side{position:relative;z-index:3}.player-label{display:flex;align-items:center;gap:9px;margin-bottom:42px;color:#31566d;font-family:Georgia,"Times New Roman",serif;font-size:18px;font-weight:700}.player-label span{display:grid;width:30px;height:30px;place-items:center;border:1px solid #9b8357;border-radius:50%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:10px}.attempt-row{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:13px}.attempt-row span{display:grid;aspect-ratio:1;place-items:center;border:1px solid #8f896f;border-radius:7px;background:#fffaf0;color:#284b65;font-family:Georgia,"Times New Roman",serif;font-size:clamp(15px,2vw,22px);font-weight:850;box-shadow:0 2px 0 rgba(82,66,37,.16)}.attempt-row .hit{background:#5a9c45;border-color:#3f7632;color:#fff}.attempt-row .near{background:#d39b45;border-color:#a97427;color:#2f2819}.attempt-row .miss{background:#d8d0bd;color:#68706b}.attempt-count{margin:18px 0 0;color:#6f705f;font-size:12px;font-weight:800;text-align:right;text-transform:uppercase;letter-spacing:.08em}.shared-word{position:absolute;z-index:4;left:50%;bottom:32px;transform:translateX(-50%) rotate(-2deg);min-width:210px;padding:13px 24px;border:1px solid #9e7955;border-radius:8px;background:#f6e2b5;box-shadow:0 7px 16px rgba(73,57,30,.15);text-align:center}.shared-word span{display:block;color:#7a623b;font-size:9px;font-weight:850;letter-spacing:.16em;text-transform:uppercase}.shared-word strong{display:block;margin-top:5px;color:#1d4664;font-family:Georgia,"Times New Roman",serif;font-size:24px;letter-spacing:.18em}
.section{width:min(calc(100% - 48px),1120px);margin:0 auto;padding:100px 0;border-top:1px solid var(--line)}.section-heading{display:grid;grid-template-columns:minmax(0,.82fr) minmax(280px,.42fr);column-gap:70px;align-items:end}.section-heading .eyebrow{grid-column:1}.section-heading h2{grid-column:1}.section-heading>p:last-child{grid-column:2;grid-row:1/span 2;margin:0;font-size:18px;line-height:1.65}.steps{margin:64px 0 0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.steps li{min-width:0;padding:27px 26px;border-top:3px solid var(--green);background:color-mix(in srgb,var(--surface) 68%,transparent)}.steps li>span{display:block;margin-bottom:42px;color:var(--ochre);font-family:Georgia,"Times New Roman",serif;font-size:15px;font-weight:800}.steps p,.mode-card p,.trust-grid p,.avi-copy>p,.section-heading>p,.closing>p{line-height:1.65}.steps p,.mode-card p,.trust-grid p{margin:12px 0 0}
.section-modes{width:100%;padding-inline:max(24px,calc((100% - 1120px)/2));background:rgba(226,215,190,.42)}.section-modes .section-heading,.mode-grid{max-width:1120px;margin-inline:auto}.mode-grid{margin-top:64px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.mode-card{position:relative;min-height:240px;padding:28px;border:1px solid var(--line);border-radius:22px;background:color-mix(in srgb,var(--surface-strong) 86%,transparent)}.mode-card:before{content:"";position:absolute;inset:7px;border:1px solid rgba(150,128,87,.19);border-radius:15px;pointer-events:none}.mode-meta{position:relative;display:flex;justify-content:space-between;gap:12px;margin-bottom:54px;color:var(--muted);font-size:11px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.mode-connected{border-top:4px solid var(--green)}.mode-local{border-top:4px solid var(--ochre)}
.trust-grid{margin-top:64px;display:grid;grid-template-columns:repeat(3,1fr);gap:34px}.trust-grid article{padding-right:24px}.check{display:grid;width:36px;height:36px;margin-bottom:28px;place-items:center;border:1px solid var(--green);border-radius:50%;color:var(--green);font-size:18px;font-weight:850}
.avi-section{display:grid;grid-template-columns:minmax(280px,.7fr) minmax(0,1fr);align-items:center;gap:95px}.avi-portrait{position:relative;width:min(100%,390px);aspect-ratio:1;margin:auto;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:45% 55% 48% 52%;background:radial-gradient(circle at 55% 35%,#f6e5b4 0,#e3c989 48%,#c9a762 100%);box-shadow:var(--shadow)}.avi-head{position:absolute;top:23%;width:43%;aspect-ratio:1.12;border:5px solid #3b4e4a;border-radius:42% 42% 47% 47%;background:#ebe1c7;box-shadow:inset 0 -10px 0 rgba(120,95,51,.13)}.avi-head:after{content:"";position:absolute;inset:17%;border-radius:38%;background:#183b32}.avi-head span{position:absolute;z-index:2;left:50%;top:49%;transform:translate(-50%,-50%);color:#8cdf62;font-size:25px;font-weight:850;white-space:nowrap}.avi-antenna{position:absolute;z-index:2;left:50%;top:15%;width:4px;height:13%;background:#3b4e4a;transform:rotate(10deg);transform-origin:bottom}.avi-antenna:after{content:"";position:absolute;left:-5px;top:-8px;width:14px;height:14px;border-radius:50%;background:var(--green)}.avi-body{position:absolute;top:57%;width:37%;height:26%;display:grid;place-items:center;border:5px solid #3b4e4a;border-radius:38% 38% 45% 45%;background:#e8dcc0;color:#3d6b3b;font-size:17px;font-weight:900}.avi-copy h2{max-width:12ch}.avi-copy>p{max-width:54ch;margin:24px 0 0;font-size:19px}.avi-copy .note{padding-left:18px;border-left:3px solid var(--ochre);color:var(--muted);font-size:14px}
.language-section{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:60px}.language-section .section-heading{display:block}.language-section .section-heading>p:last-child{max-width:65ch;margin:24px 0 0;font-size:18px}.language-list{max-width:330px;margin:0;padding:25px 28px;border:1px solid var(--line);border-radius:18px;background:color-mix(in srgb,var(--surface) 76%,transparent);color:var(--ink);font-family:Georgia,"Times New Roman",serif;font-size:19px;line-height:1.8;text-align:center}
.closing{width:min(calc(100% - 48px),1120px);margin:0 auto 90px;padding:70px;border:1px solid #bca77d;border-radius:30px;background:linear-gradient(135deg,rgba(224,236,205,.82),rgba(248,228,186,.72));box-shadow:var(--shadow)}.closing h2{max-width:16ch}.closing>p:not(.eyebrow){max-width:60ch;margin:24px 0 0;font-size:18px;line-height:1.65}
footer{width:min(calc(100% - 48px),1120px);margin:0 auto;padding:30px 0 40px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:flex-start;gap:40px}.footer-brand{display:flex;flex-direction:column;gap:14px;color:var(--muted);font-size:12px}.footer-logo{width:180px}footer nav{max-width:620px;display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px 18px}footer nav a{color:var(--muted);font-size:13px;font-weight:700}
@media(max-width:920px){.site-header{grid-template-columns:180px 1fr}.language-nav{grid-column:1/-1;justify-content:center;border-top:1px solid var(--line);padding-top:8px}.hero{grid-template-columns:1fr;gap:54px}.hero-copy{max-width:720px}.duel-board{width:min(100%,650px);margin:auto}.section-heading{grid-template-columns:1fr;gap:20px}.section-heading>p:last-child{grid-column:1;grid-row:auto}.avi-section{gap:55px}.language-section{grid-template-columns:1fr}.language-list{max-width:none}}
@media(max-width:680px){html,body{max-width:100%;overflow-x:hidden}.site-header{width:calc(100% - 24px);grid-template-columns:1fr;padding:14px;margin-top:12px}.header-logo{width:190px;margin:auto}.primary-nav{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--line);padding-top:8px}.primary-nav a{min-width:0;padding-inline:5px;text-align:center;font-size:11px;overflow-wrap:anywhere}.language-nav{grid-column:1;min-width:0}.language-nav a{font-size:10px}.hero,.section,.closing,footer{width:calc(100% - 32px)}.hero{padding:52px 0 70px}.hero-logo{width:min(100%,360px)}h1{font-size:clamp(44px,14vw,62px)}h2{font-size:clamp(36px,11vw,50px)}.hero-lead{font-size:17px}.duel-board{min-height:430px;padding:42px 20px 90px;gap:20px;border-radius:22px}.duel-board:before{inset:8px}.player-label{flex-direction:column;align-items:flex-start;margin-bottom:28px;font-size:14px}.attempt-row{gap:3px}.attempt-row span{border-radius:5px;font-size:14px}.shared-word{bottom:25px;min-width:170px;padding:10px 17px}.shared-word strong{font-size:20px}.section{padding:72px 0}.section-modes{width:100%;padding-inline:16px}.steps,.mode-grid,.trust-grid{grid-template-columns:1fr}.steps{gap:12px}.steps li>span{margin-bottom:24px}.mode-card{min-height:215px}.trust-grid{gap:42px}.avi-section{grid-template-columns:1fr;gap:55px}.avi-portrait{width:min(90%,340px)}.closing{padding:38px 28px;margin-bottom:60px}.actions{flex-direction:column;align-items:stretch}.button{width:100%;text-align:center}footer{flex-direction:column}footer nav{justify-content:flex-start}}
@media(prefers-color-scheme:dark){:root{--paper:#111715;--paper-deep:#1b2420;--surface:#18211e;--surface-strong:#1d2824;--ink:#f6edda;--body:#d4dcd5;--muted:#aab4ad;--line:#47544d;--green:#83d260;--green-soft:#263c2b;--ochre:#e0aa55;--terracotta:#d27b5b;--shadow:0 24px 60px rgba(0,0,0,.28)}body{background:radial-gradient(circle at 82% 5%,rgba(62,103,56,.24) 0,transparent 28rem),radial-gradient(circle at 12% 26%,rgba(148,97,45,.15) 0,transparent 22rem),repeating-linear-gradient(0deg,transparent 0,transparent 4px,rgba(255,255,255,.012) 5px),none}.primary-nav a:hover,.primary-nav a:focus-visible,.language-nav a:hover,.language-nav a:focus-visible,.language-nav a[aria-current=page]{color:#b0ef94}.button-primary{background:#edf2e7;color:#18302d;border-color:#edf2e7}.duel-board{background:linear-gradient(90deg,#292821 0,#24241f 49.5%,#1c1e1b 50%,#292821 51%);border-color:#74684e}.attempt-row span{background:#34352e;color:#f4ecd9;border-color:#79725f}.attempt-row .hit{background:#477b39;color:#fff}.attempt-row .near{background:#9a6c2b;color:#fff0d2}.attempt-row .miss{background:#424944;color:#bdc7bf}.shared-word{background:#59472c;border-color:#967445}.shared-word span{color:#ddc28c}.shared-word strong{color:#f4ecd9}.player-label{color:#d5ded6}.section-modes{background:rgba(17,27,23,.56)}.closing{background:linear-gradient(135deg,rgba(45,68,42,.82),rgba(82,59,31,.66))}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button{transition:none}}
`;
