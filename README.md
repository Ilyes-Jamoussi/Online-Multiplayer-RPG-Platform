# Manor Tactics - Online Multiplayer RPG Platform

[](#overview) [](#aperçu)

---

## Overview

**Manor Tactics** is a comprehensive tactical RPG platform featuring real-time multiplayer gameplay with turn-based combat mechanics. Built with Angular frontend and NestJS backend, the application includes a game editor for creating custom maps and scenarios, real-time chat functionality, and support for both human and virtual players. Players navigate grid-based maps with various terrain types including water, walls, ice, doors, teleporters, and sanctuaries.

🎮 **[Play Live Demo](http://13.60.84.0)**

![Manor Tactics Game](https://via.placeholder.com/800x400/1a1a2e/eaeaea?text=Manor+Tactics+-+Tactical+RPG)

## Features

- **Real-time Multiplayer**: Play with 2-4 players using Socket.IO for instant synchronization
- **Game Modes**: Classic mode and Capture the Flag (CTF)
- **Custom Map Editor**: Visual editor with drag-and-drop tile placement
- **Turn-based Combat**: Strategic gameplay with attack, defense, and special abilities
- **Virtual Players**: AI opponents with configurable difficulty (Beginner, Expert)
- **Live Chat**: In-game chat system for player communication
- **Persistent Data**: MongoDB integration for saving games and player progress

## Technologies

- **Frontend**: Angular 18, TypeScript, SCSS, Socket.IO Client
- **Backend**: NestJS, TypeScript, Socket.IO, MongoDB, Mongoose
- **Deployment**: Amazon EC2, Nginx, PM2, GitHub Actions
- **Testing**: Jest, Jasmine
- **Tools**: Swagger, Postman, ESLint, Prettier

## Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 20.x or above
- **npm**: Version 10.x or above
- **MongoDB**: Local instance or MongoDB Atlas account

## Project Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ilyes-Jamoussi/Online-Multiplayer-RPG-Platform.git
   cd Online-Multiplayer-RPG-Platform
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd server
   npm ci
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd client
   npm ci
   ```

4. **Configure Environment Variables**:
   
   Create a `.env` file in the `server` directory:
   ```env
   DATABASE_CONNECTION_STRING=mongodb://localhost:27017/manor-tactics
   PORT=3000
   ```

5. **Build the Backend**:
   ```bash
   cd server
   npm run build
   ```

6. **Build the Frontend**:
   ```bash
   cd client
   npm run build
   ```

## Running the Application

### Development Mode

**Backend**:
```bash
cd server
npm start
```

**Frontend**:
```bash
cd client
npm start
```

Access the application at `http://localhost:4200`

### Production Mode

The application is deployed on AWS EC2 with automated CI/CD. Visit the live demo at **http://13.60.84.0**

## Testing

**Run Backend Tests**:
```bash
cd server
npm test
```

**Run Frontend Tests**:
```bash
cd client
npm test
```

**Generate Coverage Reports**:
```bash
npm run coverage
```

## API Documentation

Once the server is running, access the Swagger API documentation at:
```
http://localhost:3000/api/docs
```

## Deployment

The application uses GitHub Actions for automated deployment to AWS EC2. Every push to the `master` branch triggers:
1. Frontend build
2. Deployment to EC2 via SSH
3. Backend rebuild and PM2 restart
4. Nginx configuration update

---

## Aperçu

**Manor Tactics** est une plateforme RPG tactique complète avec gameplay multijoueur en temps réel et mécaniques de combat au tour par tour. Construite avec Angular en frontend et NestJS en backend, l'application inclut un éditeur de jeu pour créer des cartes et scénarios personnalisés, un système de chat en temps réel, et le support de joueurs humains et virtuels. Les joueurs naviguent sur des cartes en grille avec différents types de terrain incluant l'eau, les murs, la glace, les portes, les téléporteurs et les sanctuaires.

🎮 **[Jouer à la démo en direct](http://13.60.84.0)**

![Manor Tactics Game](https://via.placeholder.com/800x400/1a1a2e/eaeaea?text=Manor+Tactics+-+RPG+Tactique)

## Fonctionnalités

- **Multijoueur en temps réel** : Jouez avec 2-4 joueurs utilisant Socket.IO pour une synchronisation instantanée
- **Modes de jeu** : Mode classique et Capture du drapeau (CTF)
- **Éditeur de carte personnalisé** : Éditeur visuel avec placement de tuiles par glisser-déposer
- **Combat au tour par tour** : Gameplay stratégique avec attaque, défense et capacités spéciales
- **Joueurs virtuels** : Adversaires IA avec difficulté configurable (Débutant, Expert)
- **Chat en direct** : Système de chat en jeu pour la communication entre joueurs
- **Données persistantes** : Intégration MongoDB pour sauvegarder les parties et la progression

## Technologies

- **Frontend** : Angular 18, TypeScript, SCSS, Socket.IO Client
- **Backend** : NestJS, TypeScript, Socket.IO, MongoDB, Mongoose
- **Déploiement** : Amazon EC2, Nginx, PM2, GitHub Actions
- **Tests** : Jest, Jasmine
- **Outils** : Swagger, Postman, ESLint, Prettier

## Prérequis

Assurez-vous d'avoir les éléments suivants installés :

- **Node.js** : Version 20.x ou supérieure
- **npm** : Version 10.x ou supérieure
- **MongoDB** : Instance locale ou compte MongoDB Atlas

## Configuration du projet

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/Ilyes-Jamoussi/Online-Multiplayer-RPG-Platform.git
   cd Online-Multiplayer-RPG-Platform
   ```

2. **Installer les dépendances Backend** :
   ```bash
   cd server
   npm ci
   ```

3. **Installer les dépendances Frontend** :
   ```bash
   cd client
   npm ci
   ```

4. **Configurer les variables d'environnement** :
   
   Créer un fichier `.env` dans le répertoire `server` :
   ```env
   DATABASE_CONNECTION_STRING=mongodb://localhost:27017/manor-tactics
   PORT=3000
   ```

5. **Compiler le Backend** :
   ```bash
   cd server
   npm run build
   ```

6. **Compiler le Frontend** :
   ```bash
   cd client
   npm run build
   ```

## Exécuter l'application

### Mode Développement

**Backend** :
```bash
cd server
npm start
```

**Frontend** :
```bash
cd client
npm start
```

Accéder à l'application sur `http://localhost:4200`

### Mode Production

L'application est déployée sur AWS EC2 avec CI/CD automatisé. Visitez la démo en direct sur **http://13.60.84.0**

## Tests

**Exécuter les tests Backend** :
```bash
cd server
npm test
```

**Exécuter les tests Frontend** :
```bash
cd client
npm test
```

**Générer les rapports de couverture** :
```bash
npm run coverage
```

## Documentation API

Une fois le serveur lancé, accédez à la documentation Swagger de l'API sur :
```
http://localhost:3000/api/docs
```

## Déploiement

L'application utilise GitHub Actions pour le déploiement automatisé sur AWS EC2. Chaque push sur la branche `master` déclenche :
1. Build du frontend
2. Déploiement sur EC2 via SSH
3. Rebuild du backend et redémarrage PM2
4. Mise à jour de la configuration Nginx


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