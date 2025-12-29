# Manor Tactics - Online Multiplayer RPG Platform

[](#overview) [](#aperçu)

---

## Overview

**Manor Tactics** is a comprehensive tactical RPG platform featuring real-time multiplayer gameplay with turn-based combat mechanics. Players navigate grid-based maps, engage in strategic combat, and complete objectives in two distinct game modes. The platform includes a complete game editor, session management system, and support for both human and AI players.

🎮 **[Play Live Demo](http://13.60.84.0)**

![Manor Tactics Game](https://via.placeholder.com/800x400/1a1a2e/eaeaea?text=Manor+Tactics+-+Tactical+RPG)

## Key Features

### Game Modes

**Classic Mode**: Players compete to win 3 combats. First player to reach this threshold wins the game.

**Capture the Flag (CTF)**: Team-based gameplay where players must capture the flag and return it to their starting point to win.

### Core Gameplay Mechanics

- **Turn-based Combat System**: Strategic combat with attack/defense postures, dice rolls, and attribute-based calculations
- **Grid-based Movement**: Navigate maps with varied terrain types, each affecting movement costs differently
- **Real-time Multiplayer**: 2-6 players depending on map size, synchronized via WebSocket (Socket.IO)
- **Character Customization**: Players create characters with customizable attributes (Life, Speed, Attack, Defense) and bonus dice (D4/D6)
- **Interactive Terrain**: Water, ice, walls, doors, teleportation tiles, each with unique gameplay effects
- **Environmental Objects**: Boats for water navigation, healing sanctuaries, combat sanctuaries
- **Live Chat System**: Real-time communication between players during sessions

### Game Editor

- **Visual Map Editor**: Drag-and-drop interface for creating custom game maps
- **Multiple Map Sizes**: Small (10x10), Medium (15x15), Large (20x20) grids
- **Tile Applicators**: Tools for placing walls, doors, water, ice, and teleportation tiles
- **Object Placement**: Drag-and-drop system for start points, flags, sanctuaries, and boats
- **Validation System**: Comprehensive validation ensuring map playability (accessibility checks, door placement rules, terrain coverage)
- **Dynamic Preview**: Real-time map preview with game metadata

### Session Management

- **Session Creation & Discovery**: Browse available games and create new sessions
- **Waiting Room**: Pre-game lobby with player list, chat, and team assignment (CTF mode)
- **Virtual Players (AI)**: Two AI profiles (Aggressive/Defensive) with strategic decision-making
- **Session Locking**: Automatic locking when player limit is reached
- **Player Kick System**: Host can remove players before game starts

### Advanced Features

- **Combat System**: Simultaneous attack resolution with offensive/defensive postures
- **Teleportation Pairs**: Up to 5 linked teleportation tile pairs per map
- **Sanctuary System**: Healing and combat buff sanctuaries with "double or nothing" mode
- **Flag Transfer**: Team members can request/transfer flag possession (CTF mode)
- **Game Log**: Comprehensive event logging with filtering options
- **Statistics Tracking**: Individual and global game statistics
- **Debug Mode**: Host-controlled debug features for testing

## Technologies

### Frontend Architecture
- **Angular 18**: Modern component-based architecture with standalone components
- **TypeScript**: Strict type safety across the entire codebase
- **SCSS**: Modular styling with component-scoped styles
- **Socket.IO Client**: Real-time bidirectional communication
- **RxJS**: Reactive state management and event handling

### Backend Architecture
- **NestJS**: Modular backend architecture with dependency injection
- **Socket.IO**: WebSocket gateway for real-time game events
- **MongoDB + Mongoose**: Document-based data persistence
- **Swagger**: Auto-generated API documentation

### Key Backend Modules
- **Session Module**: Manages game sessions, player joining, and lobby state
- **In-Game Module**: Handles turn management, movement, combat, and game logic
- **Game Store Module**: CRUD operations for game maps and metadata
- **Chat Module**: Real-time messaging system
- **Game Log Module**: Event tracking and statistics

### DevOps & Deployment
- **Amazon EC2**: Cloud hosting with Ubuntu Server
- **Nginx**: Reverse proxy and static file serving
- **PM2**: Process management with auto-restart
- **GitHub Actions**: Automated CI/CD pipeline
- **MongoDB Atlas**: Cloud database with automatic backups

### Development Tools
- **Jest**: Backend unit testing with comprehensive coverage
- **Jasmine + Karma**: Frontend unit testing
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Automatic code formatting
- **Postman**: API testing and documentation

## Project Architecture

```
Manor Tactics Platform
│
├── Client (Angular)
│   ├── Pages (Home, Editor, Session, Game, Statistics)
│   ├── Components (Game Board, Player Cards, Chat, Combat Interface)
│   ├── Services (Socket, Game Logic, Session Management)
│   └── Guards & Interceptors
│
├── Server (NestJS)
│   ├── Modules
│   │   ├── Session (Lobby & Player Management)
│   │   ├── In-Game (Turn Logic, Combat, Movement)
│   │   ├── Game Store (Map CRUD & Validation)
│   │   ├── Chat (Real-time Messaging)
│   │   └── Game Log (Event Tracking)
│   ├── Gateways (WebSocket Event Handlers)
│   ├── Controllers (REST API Endpoints)
│   └── Schemas (MongoDB Models)
│
└── Common (Shared Types & Constants)
    ├── Interfaces (Player, Session, Combat, Map)
    ├── Enums (Tiles, Events, Game Modes)
    └── Constants (Game Rules, Validation)
```

## Game Mechanics Highlights

### Movement System
- **Terrain-based Costs**: Ice (0), Base terrain (1), Open door (1), Water (2), Water with boat (1)
- **Pathfinding**: Algorithm calculates reachable tiles considering terrain costs and obstacles
- **Movement Points**: Based on Speed attribute, refreshed each turn
- **Bonus Movement**: Boats provide 4 bonus movement points for water navigation

### Combat System
- **Simultaneous Resolution**: Both players attack at the same time each combat turn
- **Posture Selection**: Offensive (+2 attack) or Defensive (+2 defense) with 5-second timer
- **Dice Mechanics**: D4 or D6 bonus dice assigned to attack/defense during character creation
- **Damage Calculation**: `(Attack + Dice + Posture) - (Defense + Dice + Posture) = Damage`
- **Terrain Effects**: Ice terrain applies -2 penalty to both attack and defense
- **Sanctuary Buffs**: Combat sanctuaries provide temporary +1 attack/+1 defense

### AI Implementation
- **Aggressive Profile**: Seeks combat, uses offensive postures, pursues flag carriers
- **Defensive Profile**: Avoids unnecessary combat, uses defensive postures, guards objectives
- **Strategic Behavior**: AI uses interactive tiles (doors, teleporters, sanctuaries) when advantageous
- **Human-like Timing**: Simulated "thinking time" for realistic gameplay

### Map Editor Validation
- **Door Placement**: Doors must be between two walls on the same axis
- **Accessibility Check**: All terrain tiles must be reachable from every start point
- **Terrain Coverage**: Minimum 50% of map must be traversable terrain
- **Object Requirements**: All start points and flags (CTF) must be placed
- **Teleporter Pairing**: Maximum 5 teleporter pairs, each properly linked

## Deployment

The application is deployed on AWS EC2 with automated CI/CD:

- **Frontend**: Nginx serves static Angular build on port 80
- **Backend**: Node.js with PM2 process manager on port 3000
- **Database**: MongoDB Atlas with automatic backups
- **CI/CD**: GitHub Actions triggers deployment on push to master branch

**Live Demo**: http://13.60.84.0

## API Documentation

Interactive Swagger documentation available at:
```
http://13.60.84.0:3000/api/docs
```

## Testing

The project includes comprehensive test coverage:

**Backend Tests**:
```bash
cd server
npm test              # Run all tests
npm run coverage      # Generate coverage report
```

**Frontend Tests**:
```bash
cd client
npm test              # Run all tests
npm run coverage      # Generate coverage report
```

---

## Aperçu

**Manor Tactics** est une plateforme RPG tactique complète avec gameplay multijoueur en temps réel et mécaniques de combat au tour par tour. Les joueurs naviguent sur des cartes en grille, participent à des combats stratégiques et accomplissent des objectifs dans deux modes de jeu distincts. La plateforme inclut un éditeur de jeu complet, un système de gestion de sessions et le support de joueurs humains et IA.

🎮 **[Jouer à la démo en direct](http://13.60.84.0)**

![Manor Tactics Game](https://via.placeholder.com/800x400/1a1a2e/eaeaea?text=Manor+Tactics+-+RPG+Tactique)

## Fonctionnalités principales

### Modes de jeu

**Mode Classique** : Les joueurs s'affrontent pour remporter 3 combats. Le premier joueur à atteindre ce seuil gagne la partie.

**Capture du Drapeau (CTF)** : Gameplay en équipe où les joueurs doivent capturer le drapeau et le ramener à leur point de départ pour gagner.

### Mécaniques de jeu principales

- **Système de combat au tour par tour** : Combat stratégique avec postures attaque/défense, jets de dés et calculs basés sur les attributs
- **Déplacement sur grille** : Navigation sur des cartes avec types de terrain variés, chacun affectant différemment les coûts de déplacement
- **Multijoueur en temps réel** : 2-6 joueurs selon la taille de la carte, synchronisés via WebSocket (Socket.IO)
- **Personnalisation des personnages** : Création de personnages avec attributs personnalisables (Vie, Rapidité, Attaque, Défense) et dés bonus (D4/D6)
- **Terrain interactif** : Eau, glace, murs, portes, tuiles de téléportation, chacun avec des effets de gameplay uniques
- **Objets environnementaux** : Bateaux pour navigation aquatique, sanctuaires de soin, sanctuaires de combat
- **Système de chat en direct** : Communication en temps réel entre joueurs pendant les sessions

### Éditeur de jeu

- **Éditeur de carte visuel** : Interface glisser-déposer pour créer des cartes de jeu personnalisées
- **Tailles de carte multiples** : Grilles Petite (10x10), Moyenne (15x15), Grande (20x20)
- **Applicateurs de tuiles** : Outils pour placer murs, portes, eau, glace et tuiles de téléportation
- **Placement d'objets** : Système glisser-déposer pour points de départ, drapeaux, sanctuaires et bateaux
- **Système de validation** : Validation complète assurant la jouabilité de la carte (vérifications d'accessibilité, règles de placement des portes, couverture du terrain)
- **Aperçu dynamique** : Prévisualisation de carte en temps réel avec métadonnées du jeu

### Gestion des sessions

- **Création et découverte de sessions** : Parcourir les jeux disponibles et créer de nouvelles sessions
- **Salle d'attente** : Lobby pré-jeu avec liste des joueurs, chat et assignation d'équipes (mode CTF)
- **Joueurs virtuels (IA)** : Deux profils d'IA (Agressif/Défensif) avec prise de décision stratégique
- **Verrouillage de session** : Verrouillage automatique lorsque la limite de joueurs est atteinte
- **Système d'exclusion** : L'hôte peut retirer des joueurs avant le début du jeu

### Fonctionnalités avancées

- **Système de combat** : Résolution d'attaque simultanée avec postures offensives/défensives
- **Paires de téléportation** : Jusqu'à 5 paires de tuiles de téléportation liées par carte
- **Système de sanctuaire** : Sanctuaires de soin et de buff de combat avec mode "double ou rien"
- **Transfert de drapeau** : Les coéquipiers peuvent demander/transférer la possession du drapeau (mode CTF)
- **Journal de jeu** : Journalisation complète des événements avec options de filtrage
- **Suivi des statistiques** : Statistiques de jeu individuelles et globales
- **Mode débogage** : Fonctionnalités de débogage contrôlées par l'hôte pour les tests

## Technologies

### Architecture Frontend
- **Angular 18** : Architecture moderne basée sur les composants avec composants autonomes
- **TypeScript** : Sécurité de type stricte dans toute la base de code
- **SCSS** : Stylisation modulaire avec styles scopés aux composants
- **Socket.IO Client** : Communication bidirectionnelle en temps réel
- **RxJS** : Gestion d'état réactive et gestion des événements

### Architecture Backend
- **NestJS** : Architecture backend modulaire avec injection de dépendances
- **Socket.IO** : Passerelle WebSocket pour événements de jeu en temps réel
- **MongoDB + Mongoose** : Persistance de données basée sur documents
- **Swagger** : Documentation API auto-générée

### Modules Backend principaux
- **Module Session** : Gère les sessions de jeu, l'arrivée des joueurs et l'état du lobby
- **Module In-Game** : Gère la gestion des tours, les déplacements, les combats et la logique de jeu
- **Module Game Store** : Opérations CRUD pour les cartes de jeu et métadonnées
- **Module Chat** : Système de messagerie en temps réel
- **Module Game Log** : Suivi des événements et statistiques

### DevOps et Déploiement
- **Amazon EC2** : Hébergement cloud avec Ubuntu Server
- **Nginx** : Reverse proxy et service de fichiers statiques
- **PM2** : Gestion de processus avec redémarrage automatique
- **GitHub Actions** : Pipeline CI/CD automatisé
- **MongoDB Atlas** : Base de données cloud avec sauvegardes automatiques

### Outils de développement
- **Jest** : Tests unitaires backend avec couverture complète
- **Jasmine + Karma** : Tests unitaires frontend
- **ESLint** : Application de la qualité et cohérence du code
- **Prettier** : Formatage automatique du code
- **Postman** : Tests et documentation API

## Architecture du projet

```
Plateforme Manor Tactics
│
├── Client (Angular)
│   ├── Pages (Accueil, Éditeur, Session, Jeu, Statistiques)
│   ├── Composants (Plateau de jeu, Cartes joueur, Chat, Interface combat)
│   ├── Services (Socket, Logique de jeu, Gestion de session)
│   └── Guards & Intercepteurs
│
├── Serveur (NestJS)
│   ├── Modules
│   │   ├── Session (Lobby & Gestion des joueurs)
│   │   ├── In-Game (Logique des tours, Combat, Déplacement)
│   │   ├── Game Store (CRUD carte & Validation)
│   │   ├── Chat (Messagerie temps réel)
│   │   └── Game Log (Suivi des événements)
│   ├── Gateways (Gestionnaires d'événements WebSocket)
│   ├── Controllers (Points de terminaison API REST)
│   └── Schemas (Modèles MongoDB)
│
└── Common (Types et constantes partagés)
    ├── Interfaces (Joueur, Session, Combat, Carte)
    ├── Enums (Tuiles, Événements, Modes de jeu)
    └── Constants (Règles de jeu, Validation)
```

## Points forts des mécaniques de jeu

### Système de déplacement
- **Coûts basés sur le terrain** : Glace (0), Terrain de base (1), Porte ouverte (1), Eau (2), Eau avec bateau (1)
- **Recherche de chemin** : Algorithme calcule les tuiles atteignables en considérant les coûts de terrain et obstacles
- **Points de mouvement** : Basés sur l'attribut Rapidité, renouvelés à chaque tour
- **Mouvement bonus** : Les bateaux fournissent 4 points de mouvement bonus pour la navigation aquatique

### Système de combat
- **Résolution simultanée** : Les deux joueurs attaquent en même temps à chaque tour de combat
- **Sélection de posture** : Offensive (+2 attaque) ou Défensive (+2 défense) avec minuterie de 5 secondes
- **Mécaniques de dés** : Dés bonus D4 ou D6 assignés à attaque/défense lors de la création du personnage
- **Calcul des dégâts** : `(Attaque + Dé + Posture) - (Défense + Dé + Posture) = Dégâts`
- **Effets de terrain** : Le terrain de glace applique une pénalité de -2 à l'attaque et à la défense
- **Buffs de sanctuaire** : Les sanctuaires de combat fournissent temporairement +1 attaque/+1 défense

### Implémentation de l'IA
- **Profil Agressif** : Cherche le combat, utilise des postures offensives, poursuit les porteurs de drapeau
- **Profil Défensif** : Évite les combats inutiles, utilise des postures défensives, garde les objectifs
- **Comportement stratégique** : L'IA utilise les tuiles interactives (portes, téléporteurs, sanctuaires) quand c'est avantageux
- **Timing humain** : Temps de "réflexion" simulé pour un gameplay réaliste

### Validation de l'éditeur de carte
- **Placement des portes** : Les portes doivent être entre deux murs sur le même axe
- **Vérification d'accessibilité** : Toutes les tuiles de terrain doivent être accessibles depuis chaque point de départ
- **Couverture du terrain** : Minimum 50% de la carte doit être du terrain traversable
- **Exigences d'objets** : Tous les points de départ et drapeaux (CTF) doivent être placés
- **Appairage de téléporteurs** : Maximum 5 paires de téléporteurs, chacune correctement liée

## Déploiement

L'application est déployée sur AWS EC2 avec CI/CD automatisé :

- **Frontend** : Nginx sert le build Angular statique sur le port 80
- **Backend** : Node.js avec gestionnaire de processus PM2 sur le port 3000
- **Base de données** : MongoDB Atlas avec sauvegardes automatiques
- **CI/CD** : GitHub Actions déclenche le déploiement lors du push sur la branche master

**Démo en direct** : http://13.60.84.0

## Documentation API

Documentation Swagger interactive disponible sur :
```
http://13.60.84.0:3000/api/docs
```

## Tests

Le projet inclut une couverture de tests complète :

**Tests Backend** :
```bash
cd server
npm test              # Exécuter tous les tests
npm run coverage      # Générer le rapport de couverture
```

**Tests Frontend** :
```bash
cd client
npm test              # Exécuter tous les tests
npm run coverage      # Générer le rapport de couverture
```



# Documentation supplémentaire

## Guide de contribution

Se référer au fichier [CONTRIBUTING.md](./CONTRIBUTING.md) pour des conseils et directives de comment maintenir un projet bien organisé et facile à comprendre pour tous les membres de l'équipe.

## Backend - NestJS

- **Contrôleurs** : Utiliser `@HttpCode(HttpStatus.XXX)` uniquement si différent du défaut NestJS (200 pour GET/PUT/PATCH, 201 pour POST).
- **DTOs** : Utiliser les décorateurs de validation (`@IsString()`, `@IsNumber()`, etc.) et `@ApiProperty()` pour valider les types correctement.

## Déploiement du projet

Se référer au fichier [DEPLOYMENT.md](DEPLOYMENT.md) pour tout ce qui a rapport avec le déploiement.

# Gestion des dépendances

## Commandes npm

Les commandes commençant par `npm` devront être exécutées dans les dossiers `client` et `server`. Les scripts non standard doivent être lancés en lançant `npm run myScript`.

## Installation des dépendances de l'application

1. Installer `npm`. `npm` vient avec `Node` que vous pouvez télécharger [ici](https://nodejs.org/en/download/)

2. Lancer `npm ci` (Clean Install) pour installer les versions exactes des dépendances du projet. Ceci est possiblement seulement si le fichier `package-lock.json` existe. Ce fichier vous est fourni dans le code de départ.

## Ajout de dépendances aux projets

Vous pouvez ajouter d'autres dépendances aux deux projets avec la commande `npm install nomDependance`.

Pour ajouter une dépendance comme une dépendance de développement (ex : librairie de tests, types TS, etc.) ajoutez l'option `--save-dev` : `npm install nomDependance --save-dev`.

Un ajout de dépendance modifiera les fichiers `package.json` et `package-lock.json`.

**Important** : assurez-vous d'ajouter ces modifications dans votre Git. N'installez jamais une dépendance du projet globalement.

**Note** : vous êtes responsables de vous assurer que les dépendances ajoutées sont fonctionnelles et ne causent pas de problèmes dans le projet. **Aucun support technique ne sera offert pour des dépendances externes ajoutées par vous.**

# Client

Ce projet est un code de départ pour un site Web fait avec le cadriciel (_framework_) Angular. Il contient un ensemble de composants et services de base pour vous aider à démarrer votre projet. La page principale permet de communiquer avec le serveur pour obtenir et envoyer des données par HTTP.

Une page utilisant _Angular Material_ est également disponible pour vous aider à démarrer avec ce _framework_ si vous voulez l'utiliser. Vous pouvez utiliser d'autres outils tels que [Bootstrap](https://getbootstrap.com/) ou [TailwindCSS](https://tailwindcss.com/) si vous le préférez.

Vous pouvez ajouter, modifier ou supprimer des composants selon vos besoins. **Important** : retirez le code de départ qui n'est pas nécessaire pour votre projet. Au besoin, vous pouvez toujours vous référer à ce code dans des anciens commits git pour voir comment faire certaines choses.

## Développement local

Lorsque la commande `npm start` est lancée dans le dossier _/client_, le script suivant (disponible dans `package.json`) est exécuté : `ng serve --open` qui exécute les 2 étapes suivantes :

1. **Bundle generation** : Traduire le code TypeScript et la syntaxe Angular en JavaScript standard. À la fin de cette étape, vous verrez que les fichiers suivants sont générés : `styles.css`, `polyfills.js`, `main.js` ainsi que le dossier `.angular`. Ces fichiers contiennent le code de votre application ainsi que le CSS des différents Components.

    **Note** : ceci est un _build_ de développement : la taille des fichiers est très grande et le code n'est pas minifié. Vous pouvez accéder à votre code à travers les outils de développement de votre navigateur et déboguer avec des _breaking points_ par exemple. Une configuration de _debugger_ pour VSCode est également disponible. Voir la section [Debugger](#debugger) pour plus d'informations.

2. **Development Server** : un serveur web statique sera lancé sur votre machine pour pouvoir servir votre application web. Le serveur est lancé sur le port 4200 et est accessible à travers `http://localhost:4200/` ou `127.0.0.1:4200`. Une page web avec cette adresse s'ouvrira automatiquement.

    **Note** : le serveur de développement n'est accessible qu'à partir de votre propre machine. Vous pouvez le rendre disponible à tous en ajoutant `--host 0.0.0.0` dans la commande `npm start`. Le site sera donc accessible dans votre réseau local à partir de votre adresse IP suivie du port 4200. Par exemple : `132.207.5.35:4200`. Notez que le serveur de développement n'est pas fait pour un déploiement ouvert et vous recevrez un avertissement en le lançant.

### Génération de composants du client

Pour créer de nouveaux composants, nous vous recommandons l'utilisation d'angular CLI. Il suffit d'exécuter `ng generate component component-name` pour créer un nouveau composant.

Il est aussi possible de générer des directives, pipes, services, guards, interfaces, enums, modules, classes, avec cette commande `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Aide supplémentaire et documentation

Pour obtenir de l'aide supplémentaire sur Angular CLI, utilisez `ng help` ou [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

Pour la documentation d'Angular, vous pouvez la trouver [ici](https://angular.dev/overview)

Pour obtenir de l'aide supplémentaire sur les tests avec Angular, utilisez [Angular Testing](https://angular.dev/guide/testing)

# Serveur

Ce projet est un code de départ pour un serveur dynamique fait avec la librairie Express ou NestJS. Il contient un ensemble de routes et de services de base pour vous aider à démarrer votre projet. Notez que la version `NestJS` contient plus de fonctionnalités et de structure que la version `Express` puisqu'elle contient la version `NestJS` des exemples de _SocketIO_ et _MongoDB_ présentés dans le cours.

## Choix du serveur

Vous avez le choix entre 2 manières et ensembles de technologies pour développer votre serveur. Le dossier `/server` contient un serveur utilisant _NodeJS_ et la librairie _Express_. Le dossier `/server-nestjs` contient un serveur utilisant le cadriciel de développement _NestJS_ qui se base sur _NodeJS_ et _Express_, mais est architecturalement très similaire à _Angular_.

Vous devez choisir un des deux projets pour votre développement. Lisez bien la section `Choix de serveur à utiliser` dans le [README](./server-nestjs/README.md) du serveur _NestJS_ pour avoir plus de détails sur les actions à effectuer selon votre choix.

## Développement local

Lorsque la commande `npm start` est lancée dans le dossier _/server_, le script suivant (disponible dans `package.json`) est exécuté : `nodemon` qui effectue 2 étapes similaires au client :

1. **Build** : transpile le code TypeScript en JavaScript et copie les fichiers dans le répertoire `/out`.

    **Note** : L'outil `nodemon` est un utilitaire qui surveille pour des changements dans vos fichiers `*.ts` et relance automatiquement le serveur si vous modifiez un de ses fichiers. La modification de tout autre fichier nécessitera un relancement manuel du serveur (interrompre le processus et relancer `npm start`).

2. **Deploy** : lance le serveur à partir du fichier `index.js`. Le serveur est lancé sur le port 3000 et est accessible à travers `http://localhost:3000/` ou `127.0.0.1:3000`. Le site est aussi accessible dans votre réseau local à partir de votre adresse IP suivie du port 3000. Par exemple : `132.207.5.35:3000`. Un _debugger_ est également attaché au processus Node. Voir la section [Debugger](#debugger) pour plus d'information.

    **Note** : ceci est un serveur dynamique qui ne sert pas des pages HTML, mais répond à des requêtes HTTP. Pour savoir comment accéder à sa documentation et connaître plus sur son fonctionnement, consultez la section _Documentation du serveur_ dans ce document.

## Documentation du serveur

La documentation de votre serveur est disponible en format OpenAPI sur la route suivante : `/api/docs`
Pour y accéder, vous pouvez aller à `<url_serveur>/api/docs` une fois le serveur démarré.

Cette page décrit les différentes routes accessibles sur le serveur ainsi qu'une possibilité de les tester en envoyant des requêtes au serveur. Vous n'avez qu'à choisir une des routes et appuyer sur le bouton **Try it out** et lancer la requête avec **Execute**.

# Outils de développement et assurance qualité

## Tests unitaires et couverture de code

Les deux projets viennent avec des tests unitaires et des outils de mesure de la couverture du code.
Les tests se retrouvent dans les fichiers `*.spec.ts` dans le code source des deux projets. Le client utilise la librairie _Jasmine_ et le serveur utilise _Mocha_, _Chai_, _Sinon_ et _Supertest_ (_Jest_ pour le projet NestJS).

Les commandes pour lancer les tests et la couverture du code sont les suivantes. Il est fortement recommandé de les exécuter souvent, s'assurer que vos tests n'échouent pas et, le cas échéant, corriger les problèmes soulevés par les tests.

-   Exécuter `npm run test` pour lancer les tests unitaires.

-   Exécuter `npm run coverage` pour générer un rapport de couverture de code.
    -   Un rapport sera généré dans la sortie de la console.
    -   Un rapport détaillé sera généré dans le répertoire `/coverage` sous la forme d'une page web. Vous pouvez ouvrir le fichier `index.html` dans votre navigateur et naviguer à travers le rapport. Vous verrez les lignes de code non couvertes par les tests.

## Linter et règles d'assurance qualité

Les deux projets viennent avec un ensemble de règles d'assurance qualité pour le code et son format. L'outil _ESLint_ est un outil d'analyse statique qui permet de détecter certaines odeurs dans le code.

Les règles pour le linter sont disponibles dans le fichier `eslint.config.mjs` dans la racine du projet ainsi que le dossier de chaque projet.

**Note** : un _linter_ ne peut pas prévenir toutes les odeurs de code possibles. Faites attention à votre code et utilisez des révisions manuelles par les pairs le plus possible.

Le _linter_ peut être lancé avec la commande `npm run lint`. La liste de problèmes sera affichée directement dans votre console.

La commande `npm run lint:fix` permet de corriger automatiquement certains problèmes de lint. **Attention** : cette commande peut modifier votre code. Assurez-vous de bien comprendre les modifications apportées avant de les accepter.

**Note** : on vous recommande de lancer le _linter_ souvent lorsque vous écrivez du code. Idéalement, assurez-vous qu'il n'y a aucune erreur de lint avant de faire un _commit_ sur Git.

## Debugger

Il est possible d'attacher un _debugger_ directement dans VSCode pour les 2 projets. Le fichier [launch.json](./.vscode/launch.json) contient les 2 configurations.

**Important** : avant de pouvoir utiliser le _debugger_ sur un projet, il faut que celui-ci soit lancé avec la commande `npm start` ou, si vous utilisez le serveur _NestJS_, `npm run start:debug`.

Pour utiliser le _debugger_, il faut lancer la configuration qui correspond au projet visé. Vous pouvez accéder au menu _Run and Debug_ avec le raccourci <kbd>CTRL</kbd>+<kbd>SHIFT</kbd>+<kbd>D</kbd> et choisir la bonne configuration.

Dans le cas du site Web, utilisez **Launch Client With Debug**. Ceci ouvrira une nouvelle fenêtre sur le port 4200 de votre machine.

Pour le serveur dynamique, utilisez **Debug Server (Attach)**. Ceci se connectera à votre instance Node en cours.

Une fois le _debugger_ lancé, vous pouvez ajouter des _breakpoints_ directement dans votre code Typescript pour vous aider avec votre développement.

# Intégration continue

Les 2 projets viennent avec une configuration d'intégration continue (_Continuous Integration_ ou _CI_) pour la plateforme GitLab.

Cette configuration permet de lancer un pipeline de validations sur le projet en 3 étapes dans l'ordre suivant: _install_, _lint_ et _test_. Si une de ces étapes échoue, le pipeline est marqué comme échoué et une notification sera visible sur GitLab. La seule exception est l'étape de _lint_ qui ne bloque pas le pipeline si elle échoue, mais donne quand même un avertissement visuel.

Vous pouvez consulter la console de l'étape échouée pour plus de détails sur la raison de l'échec.

Le pipeline sera lancé suite aux 2 actions suivantes : lors d'un commit sur la branche principale ou dans le cas d'une demande d'intégration : _Merge Request_ (MR) entre 2 branches. Dans le cas d'une MR, chaque nouveau commit lancera un nouveau pipeline de validation.

On vous recommande **fortement** de ne pas faire des commits sur la branche principale, mais de plutôt toujours passer par des branches. Également, évitez d'ouvrir une MR avant d'avoir écrit le code à fusionner, mais faites-la plutôt lorsque vous êtes prêts à faire la fusion. Ceci vous évitera de lancer des pipelines inutiles avec chaque nouveau commit.

On vous recommande **fortement** de ne pas accepter une MR dont le pipeline associé a échoué. Réglez les problèmes soulevés par la _CI_ pour éviter de fusionner du code inadéquat au reste de votre projet.

# Standards de programmations

Cette section présente les différents standards de programmations qu'on vous recommande de respecter lors de la réalisation de ce projet et qui seront utilisés pour la correction de l'assurance qualité de votre projet.

Référez-vous au fichier [eslint.config.basic.mjs](./eslint.config.basic.mjs) pour les règles spécifiques.

## Conventions de nommage et de langue

On vous recommande d'utiliser les conventions de nommage suivantes :

- Utilisez le ALL_CAPS pour les constantes.
- Utilisez le PascalCase pour les noms de types et les valeurs d'énumérations.
- Utilisez le camelCase pour les noms de fonctions, de propriétés et de variables.
- Utilisez le kebab-case pour les noms de balises des composants Angular.
- Évitez les abréviations dans les noms de variables ou de fonctions.
- Un tableau/liste/dictionnaire devrait avoir un nom indiquant qu'il contient plusieurs objets, par exemple "Letters".
- Évitez de mettre le type de l'objet dans le nom, par exemple on préfère "Items" à "ListOfItems" lorsqu'on déclare une liste.
- Un objet ne devrait pas avoir un nom qui porte à croire qu'il s'agit d'un tableau.

Vous devez coder dans une langue et une seule. Nous vous recommandons d'écrire votre code en anglais, mais vous êtes libres de coder en français.

## Autres standards recommandés

- Utilisez **let** et **const**. Lorsque possible, préférez **const**. Évitez **var**.
- N'utilisez jamais **any**, que ce soit implicitement ou explicitement à moins que ce soit absolument nécessaire (ex: dans un test).
- Déclarez tous les types de retour des fonctions qui ne retournent pas des primitives.
- Évitez les fonctions qui ont plus d'une responsabilité.
- N'utilisez pas de nombres magiques. Utilisez des constantes bien nommées.
- N'utilisez pas de chaînes de caractères magiques. Créez vos propres constantes avec des noms explicites.
- **Évitez la duplication de code.**
- Séparez votre code Typescript du CSS et du HTML si le component n'est pas trivial. Générez vos component avec Angular CLI qui le fait pour vous.

# Guide de contribution

Pour assurer une collaboration efficace et maintenir la qualité du code tout au long du projet, nous avons mis en place un guide de contribution détaillé. Ce guide couvre les aspects essentiels du processus de développement, notamment :

- Les conventions de nommage des branches
- Les règles pour les messages de commit
- Le processus de création et de gestion des Merge Requests (MR)
- Les bonnes pratiques pour les revues de code

Nous vous invitons fortement à consulter le fichier [CONTRIBUTING.md](./CONTRIBUTING.md) pour plus de détails. Suivre ces directives nous aidera à maintenir un projet bien organisé et facile à comprendre pour tous les membres de l'équipe.

## Git et gestion des versions

- Gardez, le plus possible, une seule fonctionnalité par branche.
- Utilisez une branche commune de développement (nommée `dev` ou `develop`) dans laquelle vous intégrez vos modifications. Gardez vos branches de développement à jour avec la branche commune.
- Les branches doivent avoir une nomenclature standardisée. Voici des exemples :
-   Une branche de fonctionnalité devrait se nommer `feature/nom-du-feature`.
-   Une branche de correction de bogue devrait se nommer `hotfix/nom-du-bug`.

Les messages de commit doivent être concis et significatifs. Ne mettez pas des messages trop longs ou trop courts. **On devrait être capable de comprendre ce que le commit fait avec le message seulement sans lire les changements**.

Gardez le même courriel de _commiter_, peu importe l'ordinateur que vous utilisez. Il ne devrait donc pas y avoir plus de 6 contributeurs dans votre repo. Utilisez [.mailmap](https://git-scm.com/docs/gitmailmap) pour regrouper plusieurs courriels différents sous le même nom.

Si vous n'êtes pas familiers avec Git et le fonctionnement des branches, nous vous recommandons fortement d'explorer [ce guide interactif](https://learngitbranching.js.org/).