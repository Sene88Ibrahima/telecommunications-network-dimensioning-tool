# Outil de Dimensionnement des Réseaux de Télécommunications

## Présentation

Cet outil a été développé dans le cadre d'un projet universitaire pour le Master GLSI, UCAD 2024/2025. Il s'agit d'une application web complète permettant aux ingénieurs télécoms de planifier efficacement les déploiements de réseaux en tenant compte de la capacité, couverture, qualité de service et coûts.

## Fonctionnalités

L'application comprend les modules de dimensionnement suivants :

- **Réseau GSM** : Calcul du nombre de BTS, capacité trafic, rayon de cellule
- **Réseau UMTS** : Dimensionnement NodeB, calcul de capacité 3G
- **Bilan de liaison hertzienne** : Calcul de puissance, atténuation, marge de liaison
- **Bilan de liaison optique** : Pertes fibre, budget optique, portée

Autres fonctionnalités :
- Gestion de projets
- Sauvegarde/chargement des configurations
- Visualisation des résultats (graphiques et tableaux)
- Génération de rapports

## Architecture technique

L'application est construite selon une architecture moderne avec :

- **Frontend** : React.js avec Material-UI
- **Backend** : Node.js avec Express.js
- **Base de données** : SQLite (développement) / PostgreSQL (production)

## Installation

### Prérequis

- Node.js v14+ et npm
- Base de données PostgreSQL (pour la production)

### Installation du frontend

```bash
# Accéder au répertoire frontend
cd frontend

# Installer les dépendances
npm install

# Démarrer l'application en mode développement
npm start
```

### Installation du backend

```bash
# Accéder au répertoire backend
cd backend

# Installer les dépendances
npm install

# Démarrer le serveur en mode développement
npm run dev
```

## Structure du projet

```
telecom-dimensioning-tool/
├── frontend/                 # Application React
│   ├── src/
│   │   ├── components/       # Composants UI
│   │   ├── services/         # Services API
│   │   └── App.js            # Point d'entrée
│   └── package.json
├── backend/                  # API REST Node.js
│   ├── src/
│   │   ├── controllers/      # Contrôleurs
│   │   ├── models/           # Modèles de données
│   │   ├── services/         # Services de calcul
│   │   └── routes/           # Routes API
│   └── package.json
├── database/                 # Fichiers de base de données
└── docs/                     # Documentation
```

## Documentation des API

### API Projets

- `GET /api/projects` : Liste des projets
- `GET /api/projects/:id` : Détails d'un projet
- `POST /api/projects` : Créer un projet
- `PUT /api/projects/:id` : Mettre à jour un projet
- `DELETE /api/projects/:id` : Supprimer un projet

### API Calculs

- `POST /api/calculate/gsm` : Calcul dimensionnement GSM
- `POST /api/calculate/umts` : Calcul dimensionnement UMTS
- `POST /api/calculate/hertzian` : Calcul bilan hertzien
- `POST /api/calculate/optical` : Calcul bilan optique

## Formules et modèles mathématiques

### GSM
- Nombre de BTS = Surface / (3√3 × R²/2)
- Capacité trafic = Nombre de canaux × Taux d'occupation
- Rayon cellule = √(Puissance émission / (Seuil réception × Perte propagation))

### UMTS
- Capacité utilisateurs = (Eb/N0)⁻¹ × Facteur charge
- Couverture = f(Puissance, Sensibilité, Marge)

### Bilan hertzien
- Perte espace libre = 32.45 + 20log(f) + 20log(d)
- Marge liaison = Puissance émission - Seuil réception - Pertes

### Bilan optique
- Budget optique = Puissance émission - Sensibilité récepteur
- Portée max = Budget / (Atténuation linéique + Pertes connexions)

## Captures d'écran

*Des captures d'écran seront ajoutées ici*

## Développement

### Technologies utilisées

- **Frontend** :
  - React.js
  - Material-UI
  - Chart.js
  - React Router
  - Axios

- **Backend** :
  - Node.js
  - Express.js
  - Sequelize ORM
  - Joi (validation)
  - Winston (logging)

### Exécution des tests

```bash
# Tests backend
cd backend
npm test

# Tests frontend
cd frontend
npm test
```

## Auteurs

Ce projet a été développé dans le cadre du Master GLSI, UCAD 2024/2025.

## Licence

Ce projet est sous licence [MIT](LICENSE).
