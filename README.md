# 📘 xcraft-core-server

## Aperçu

Le module `xcraft-core-server` est le serveur principal du framework Xcraft. Il constitue le point d'entrée central qui orchestre le démarrage, la découverte automatique des modules, et la gestion du cycle de vie de l'ensemble de l'écosystème Xcraft. Ce module agit comme un chef d'orchestre qui coordonne tous les autres modules et services du framework.

## Sommaire

- [Structure du module](#structure-du-module)
- [Fonctionnement global](#fonctionnement-global)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Interactions avec d'autres modules](#interactions-avec-dautres-modules)
- [Configuration avancée](#configuration-avancée)
- [Détails des sources](#détails-des-sources)

## Structure du module

Le module `xcraft-core-server` s'organise autour de plusieurs composants clés :

- **Point d'entrée principal** (`index.js`) : Expose les modes d'exécution daemon et library
- **Serveur de démarrage** (`lib/server.js`) : Gère le cycle de vie complet du serveur
- **Système de boot** (`lib/boot.js`) : Découvre et charge automatiquement les modules Xcraft
- **Message du jour** (`lib/motd.js`) : Fournit des messages d'accueil thématiques inspirés de Warcraft II
- **Configuration** (`config.js`) : Définit les options de configuration avancées

## Fonctionnement global

Le serveur Xcraft fonctionne selon un processus de démarrage en plusieurs étapes :

1. **Initialisation de l'environnement** : Configuration des variables d'environnement et du devroot si activé
2. **Découverte des modules** : Scan automatique des répertoires `node_modules` pour identifier les modules Xcraft compatibles
3. **Filtrage et sélection** : Application des filtres et listes noires configurés pour déterminer quels modules charger
4. **Résolution des dépendances** : Analyse récursive des dépendances entre modules
5. **Chargement sur le bus** : Initialisation du bus de communication et chargement des commandes
6. **Services de communication** : Mise en place des handlers pour la gestion des connexions, déconnexions, et diffusion
7. **Heartbeat** : Démarrage du système de pulsation pour maintenir les connexions actives

Le serveur peut fonctionner en deux modes :

- **Mode daemon** : Processus indépendant avec gestion complète du cycle de vie
- **Mode library** : Intégré dans une application existante

## Exemples d'utilisation

### Démarrage en mode daemon

```javascript
const xServer = require('xcraft-core-server');

// Démarrage en tant que daemon
const daemon = xServer.runAsDaemon({
  logs: true,
  response: (err) => {
    if (err) {
      console.error('Erreur de démarrage:', err);
    } else {
      console.log('Serveur démarré avec succès');
    }
  },
});
```

### Démarrage en mode library

```javascript
const xServer = require('xcraft-core-server');

// Intégration dans une application
const lib = xServer.runAsLib();
lib.start((err) => {
  if (err) {
    console.error('Erreur de démarrage:', err);
  } else {
    console.log('Serveur intégré démarré');
  }
});
```

### Utilisation en ligne de commande

```bash
# Démarrage direct du serveur
./node_modules/.bin/xcraft-core-server

# Ou via npx
npx xcraft-core-server
```

## Interactions avec d'autres modules

Le serveur Xcraft interagit étroitement avec l'ensemble de l'écosystème :

- **[xcraft-core-bus]** : Utilise le bus de communication pour orchestrer les échanges entre modules
- **[xcraft-core-busclient]** : Établit la connexion client au bus pour les communications
- **[xcraft-core-daemon]** : Gère l'exécution en mode daemon avec supervision
- **[xcraft-core-etc]** : Charge les configurations des différents modules
- **[xcraft-core-transport]** : Gère le transport des messages et le routage
- **[xcraft-core-horde]** : Intégration automatique si des hordes sont configurées
- **Modules goblin-\*** : Découverte et chargement automatique de tous les modules d'acteurs
- **Modules xcraft-core-\*** : Chargement des modules de base du framework

## Configuration avancée

| Option                 | Description                                               | Type      | Valeur par défaut           |
| ---------------------- | --------------------------------------------------------- | --------- | --------------------------- |
| `userModulesPath`      | Chemin vers les modules utilisateur personnalisés         | `string`  | `''` (utilise node_modules) |
| `userModulesFilter`    | Expression régulière pour filtrer les modules utilisateur | `string`  | `''` (aucun filtre)         |
| `userModulesBlacklist` | Expression régulière pour exclure des modules             | `string`  | `''` (aucune exclusion)     |
| `useDevroot`           | Active le support de l'environnement devroot (toolchain)  | `boolean` | `false`                     |
| `modules`              | Liste restreinte de modules à charger (vide = tous)       | `array`   | `[]`                        |

### Variables d'environnement

| Variable               | Description                                                           | Exemple             | Valeur par défaut |
| ---------------------- | --------------------------------------------------------------------- | ------------------- | ----------------- |
| `XCRAFT_LOG`           | Niveau de verbosité des logs (0-5)                                    | `3`                 | `0`               |
| `XCRAFT_LOG_MODS`      | Modules spécifiques à logger (séparés par virgules)                   | `server,bus,goblin` | Tous les modules  |
| `LANGUAGE`             | Langue préférée (définie automatiquement si devroot activé)           | `en_US`             | Langue système    |
| `LANG`                 | Locale complète (définie automatiquement si devroot activé)           | `en_US.UTF-8`       | Locale système    |
| `LC_ALL`               | Locale pour toutes les catégories                                     | `en_US.UTF-8`       | Locale système    |
| `ELECTRON_RUN_AS_NODE` | Indique si l'exécution se fait dans Electron en mode Node             | `1`                 | Non défini        |
| `NODE_ENV`             | Environnement d'exécution (affecte le chargement des devDependencies) | `development`       | Non défini        |

## Détails des sources

### `index.js`

Point d'entrée principal du module qui expose deux modes d'exécution distincts. Le mode daemon utilise `xcraft-core-daemon` pour une exécution autonome avec supervision, tandis que le mode library permet l'intégration dans une application existante.

#### Méthodes publiques

- **`runAsDaemon(options)`** — Lance le serveur en mode daemon avec supervision complète et gestion des logs. Les options incluent les paramètres de logs et une fonction de callback pour la réponse.
- **`runAsLib()`** — Retourne un objet avec une méthode `start` pour intégration dans une application existante. Permet un contrôle plus fin du cycle de vie du serveur.

### `lib/server.js`

Cœur du serveur qui gère l'initialisation complète de l'environnement Xcraft. Configure la verbosité des logs, génère les messages d'accueil (MOTD), et met en place tous les services de communication nécessaires au fonctionnement du framework.

#### Fonctionnalités principales

- **Gestion des logs** : Configuration dynamique de la verbosité via `XCRAFT_LOG` et filtrage par modules via `XCRAFT_LOG_MODS`
- **Services de communication** : Handlers pour les erreurs, connexions, déconnexions et diffusion
- **Heartbeat** : Système de pulsation toutes les 500ms pour maintenir les connexions actives
- **Arrêt propre** : Gestion des signaux SIGINT/SIGTERM avec timeout de sécurité de 10 secondes
- **Génération MOTD** : Création des messages d'accueil avec informations de connexion (serveur, ports, timeout)

#### Handlers de communication

- **Error Handler** : Capture et diffuse les erreurs via le système d'événements avec format `${orcName}::${cmd}.${id}.error`
- **Shutdown Handler** : Gère l'arrêt propre avec nettoyage des modules critiques (xcraft-core-goblin, xcraft-core-cryo, xcraft-contrib-pacman, goblin-repositor)
- **Autoconnect Handler** : Facilite la connexion automatique des clients avec transfert de token et registre des commandes
- **Disconnect Handler** : Notifie les déconnexions clients via l'événement `disconnect.finished`
- **MOTD Handler** : Fournit les messages d'accueil aux clients connectés avec informations de configuration
- **Broadcast Handler** : Gère la diffusion des messages entre tous les clients connectés avec support du routage

### `lib/boot.js`

Système de découverte et de chargement automatique des modules Xcraft. Analyse récursivement les répertoires `node_modules` pour identifier les modules compatibles et résoudre leurs dépendances.

#### Processus de découverte

- **Scan des répertoires** : Recherche dans `node_modules` avec filtres configurables basés sur les patterns `^(goblin|xcraft-(core|contrib))-`
- **Validation des modules** : Vérification de la présence de `config.xcraft.commands = true` dans `package.json`
- **Résolution des dépendances** : Analyse récursive des dépendances et devDependencies (en mode développement)
- **Filtrage intelligent** : Application des listes blanches (`modules`) et noires (`userModulesBlacklist`) configurées
- **Gestion des modules utilisateur** : Support des modules personnalisés avec chemins (`userModulesPath`) et filtres (`userModulesFilter`) spécifiques

#### Gestion de l'environnement

- **Support devroot** : Configuration automatique de l'environnement de développement avec mise à jour des variables de locale (LANGUAGE, LANG, LC_ALL)
- **Détection Electron** : Gestion spécifique de l'arrêt dans un contexte Electron avec appel à `app.quit()`
- **Recherche node_modules** : Détection intelligente du répertoire racine des modules via `module.paths`
- **Intégration horde** : Ajout automatique de `xcraft-core-horde` si des hordes sont configurées

#### Méthodes publiques

- **`start(callback)`** — Démarre le processus de boot complet avec découverte et chargement des modules. Configure l'environnement, découvre les modules, et initialise le bus.
- **`stop()`** — Arrête proprement le serveur et ferme toutes les connexions via le busClient et le bus principal.

#### Propriétés exposées

- **`busClient`** — Instance du client de bus pour les communications inter-modules
- **`bus`** — Instance du bus principal pour la gestion des commandes et événements

### `lib/motd.js`

Générateur de messages d'accueil thématiques inspirés de l'univers Warcraft II. Fournit une touche ludique au démarrage du serveur en affichant des citations aléatoires de différentes unités et races.

#### Fonctionnalités

- **Citations thématiques** : Plus de 100 citations réparties entre Alliance Humaine et Horde Orque
- **Unités variées** : Peasant, Footman, Elven Archer, Knight, Paladin, Mage, Peon, Grunt, Troll, Ogre, Death Knight, etc.
- **Sélection aléatoire** : Choix automatique de la race, unité et citation via `Math.random()`
- **Immersion** : Citations authentiques du jeu original avec personnalités distinctes par unité

#### Structure des données

Les citations sont organisées par race puis par unité, chaque unité ayant un tableau de phrases caractéristiques :

```javascript
motd['Human Alliance']['Peasant'] = [
  'Ready to serve.',
  'Yes?',
  'My lord?',
  // ... autres citations
];
```

#### Méthodes publiques

- **`get()`** — Retourne un objet contenant une citation aléatoire avec sa race, unité et texte. Format : `{race: string, unit: string, text: string}`.

---

_Documentation mise à jour automatiquement._

[xcraft-core-bus]: https://github.com/Xcraft-Inc/xcraft-core-bus
[xcraft-core-busclient]: https://github.com/Xcraft-Inc/xcraft-core-busclient
[xcraft-core-daemon]: https://github.com/Xcraft-Inc/xcraft-core-daemon
[xcraft-core-etc]: https://github.com/Xcraft-Inc/xcraft-core-etc
[xcraft-core-transport]: https://github.com/Xcraft-Inc/xcraft-core-transport
[xcraft-core-horde]: https://github.com/Xcraft-Inc/xcraft-core-horde