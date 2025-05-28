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
- Export de résultats au format Excel

## Calculateurs de dimensionnement

Notre application offre quatre calculateurs spécialisés pour différents aspects des réseaux de télécommunications. Voici leurs spécificités, paramètres et exemples d'utilisation.

### 1. Calculateur GSM

#### Description
Ce module permet le dimensionnement de réseaux GSM (2G) en calculant le nombre de stations de base (BTS) nécessaires pour couvrir une zone géographique définie et gérer le trafic des abonnés.

#### Paramètres d'entrée

| Paramètre | Description | Valeur typique | Plage recommandée | Unité |
|------------|-------------|----------------|-------------------|-------|
| `coverageArea` | Surface géographique totale à couvrir. Influence directement le nombre de BTS nécessaires. | 100 | 10-1000 | km² |
| `subscriberCount` | Nombre total d'utilisateurs à desservir. Détermine les besoins en capacité. | 50000 | 1000-500000 | utilisateurs |
| `trafficPerSubscriber` | Volume de trafic moyen généré par chaque utilisateur pendant l'heure chargée. | 0.025 | 0.01-0.08 | Erlangs |
| `frequency` | Bande de fréquence utilisée pour le réseau. Affecte la propagation et la portée des cellules. | 900 | 850-1800 | MHz |
| `btsPower` | Puissance d'émission de la station de base. Valeur plus élevée augmente la couverture. | 43 | 33-47 | dBm |
| `mobileReceptionThreshold` | Niveau minimal de signal requis pour une communication de qualité. | -104 | -110 à -95 | dBm |
| `propagationModel` | Modèle mathématique utilisé pour calculer l'atténuation du signal en fonction de l'environnement. | COST231 | OKUMURA_HATA, COST231, FREE_SPACE | - |

#### Modèles de propagation disponibles
- **OKUMURA_HATA** : Modèle adapté aux environnements urbains
- **COST231** : Extension du modèle Okumura-Hata pour les fréquences jusqu'à 2 GHz
- **FREE_SPACE** : Modèle d'espace libre pour les environnements sans obstacles

#### Résultats de calcul

| Paramètre | Description | Interprétation | Unité |
|------------|-------------|-----------------|-------|
| `cellRadius` | Rayon maximal d'une cellule radio basé sur les conditions de propagation et les seuils définis. | Plus cette valeur est grande, moins de BTS sont nécessaires pour couvrir la zone. Elle diminue en milieu urbain dense ou avec une fréquence plus élevée. | km |
| `totalTraffic` | Volume total de communications estimé pour l'ensemble des abonnés. | C'est le produit du nombre d'abonnés par le trafic par abonné. Détermine les besoins en capacité. | Erlangs |
| `channelsRequired` | Nombre total de canaux radio (ressources) nécessaires pour supporter le trafic avec un taux de blocage acceptable. | Dépend du modèle d'Erlang B avec un GoS (Grade of Service) typique de 2%. | - |
| `coverageBtsCount` | Nombre de BTS requis uniquement pour assurer la couverture radio de la zone. | Calculé en divisant la superficie totale par la surface couverte par une cellule. | - |
| `capacityBtsCount` | Nombre de BTS requis uniquement pour supporter le volume de trafic. | Calculé en divisant le nombre total de canaux requis par le nombre de canaux disponibles par BTS. | - |
| `numberOfBts` | Nombre final de BTS nécessaires, déterminé par la valeur la plus contraignante entre couverture et capacité. | Représente le minimum de stations de base à déployer pour satisfaire tous les critères. Dans les zones urbaines, souvent limité par capacité; en zones rurales, par couverture. | - |

#### Exemple de configuration

```json
{
  "coverageArea": 120,
  "subscriberCount": 60000,
  "trafficPerSubscriber": 0.03,
  "frequency": 900,
  "btsPower": 43,
  "mobileReceptionThreshold": -102,
  "propagationModel": "COST231"
}
```

#### Résultats attendus

```json
{
  "cellRadius": 4.73,
  "totalTraffic": 1800,
  "channelsRequired": 1920,
  "coverageBtsCount": 6,
  "capacityBtsCount": 12,
  "numberOfBts": 12
}
```

### 2. Calculateur UMTS

#### Description
Ce module dimensionne les réseaux UMTS (3G) en calculant la capacité des liaisons montantes et descendantes, le nombre de Node B nécessaires, et la couverture cellulaire.

#### Paramètres d'entrée

| Paramètre | Description | Valeur typique | Plage recommandée | Unité |
|------------|-------------|----------------|-------------------|-------|
| `coverageArea` | Surface géographique totale à couvrir par le réseau UMTS. | 100 | 10-1000 | km² |
| `subscriberCount` | Nombre total d'utilisateurs à desservir. Crucial pour le dimensionnement en capacité. | 50000 | 5000-500000 | utilisateurs |
| `services` | Tableau définissant les services utilisés par les abonnés (voix, vidéo, données). Chaque service a un débit, un facteur d'activité et un pourcentage d'utilisateurs. | Voir exemple | - | - |
| `ebno` | Rapport énergie par bit sur densité spectrale de bruit. Paramètre de qualité qui détermine le taux d'erreur de transmission. | 7 | 5-9 | dB |
| `softHandoverMargin` | Marge allouée pour le transfert intercellulaire progressif, propre à l'UMTS. Permet aux mobiles d'être connectés à plusieurs cellules simultanément. | 3 | 1.5-6 | dB |
| `propagationParameters` | Objet contenant les paramètres qui influencent la propagation du signal, comme la fréquence, la hauteur des antennes et le type d'environnement. | Voir détail | - | - |
| `sectorsPerSite` | Nombre de secteurs par Node B, influence directement la capacité et la couverture. | 3 | 1-6 | - |

##### Détail des paramètres de propagation

```json
{
  "frequency": 2100,        // Fréquence en MHz (1900-2200)
  "mobileHeight": 1.5,     // Hauteur du mobile en mètres (1-2)
  "baseStationHeight": 30, // Hauteur de la station de base en mètres (20-50)
  "buildingCoverage": 0.7, // Proportion de bâtiments dans la zone (0-1)
  "environmentType": "URBAN" // Type d'environnement (URBAN, SUBURBAN, RURAL)
}
```

#### Configuration des services

```json
[
  {
    "name": "Voix",
    "bitRate": 12.2,
    "activityFactor": 0.67,
    "percentageOfUsers": 100
  },
  {
    "name": "Données",
    "bitRate": 384,
    "activityFactor": 1.0,
    "percentageOfUsers": 20
  }
]
```

#### Résultats de calcul

| Paramètre | Description | Interprétation | Unité |
|------------|-------------|-----------------|-------|
| `uplinkCapacity` | Objet contenant les capacités calculées pour la liaison montante (mobile vers réseau). | Contient notamment `maxUsers` (capacité utilisateurs), `loadFactor` (charge du réseau), `dataRate` (débit). Si la charge dépasse 0.75, le réseau devient instable. | - |
| `downlinkCapacity` | Objet contenant les capacités calculées pour la liaison descendante (réseau vers mobile). | Structure similaire à `uplinkCapacity` mais avec des valeurs souvent plus élevées. La capacité descendante est généralement supérieure à la montante. | - |
| `cellCoverage` | Informations sur la couverture cellulaire, incluant le rayon et la perte de propagation maximale. | Le rayon détermine la taille de la cellule et le nombre de Node B nécessaires pour couvrir la zone. | - |
| `nodeCount` | Nombre total de Node B (stations de base UMTS) requis pour satisfaire à la fois les contraintes de couverture et de capacité. | Un nombre plus élevé implique un coût d'infrastructure plus important mais une meilleure qualité de service. | - |
| `limitingFactor` | Indique quel facteur limite le plus la capacité du réseau: liaison montante ou descendante. | Généralement 'UPLINK' pour les services symmétriques comme la voix et 'DOWNLINK' pour les services asymétriques comme la navigation web. | - |

##### Détail de la structure uplinkCapacity et downlinkCapacity

```json
{
  "maxUsers": 124,           // Nombre maximal d'utilisateurs simultanés par cellule
  "loadFactor": 0.65,        // Charge du réseau (0-1), où >0.75 devient critique
  "dataRate": 3.84,          // Débit moyen en Mbps
  "averageBitRate": 12.2     // Débit moyen par utilisateur en kbps
}
```

##### Détail de la structure cellCoverage

```json
{
  "radius": 1.2,             // Rayon de cellule en km
  "area": 4.52,             // Surface couverte par une cellule en km²
  "maxPathLoss": 142.5       // Perte de propagation maximale en dB
}
```

#### Exemple de configuration complète

```json
{
  "coverageArea": 100,
  "subscriberCount": 50000,
  "services": [
    {
      "name": "Voix",
      "bitRate": 12.2,
      "activityFactor": 0.67,
      "percentageOfUsers": 100
    },
    {
      "name": "Data",
      "bitRate": 144,
      "activityFactor": 1.0,
      "percentageOfUsers": 30
    }
  ],
  "ebno": 7,
  "softHandoverMargin": 3,
  "propagationParameters": {
    "frequency": 2100,
    "mobileHeight": 1.5,
    "baseStationHeight": 30,
    "buildingCoverage": 0.7,
    "environmentType": "URBAN"
  },
  "sectorsPerSite": 3
}
```

### 3. Calculateur de Liaison Hertzienne

#### Description
Ce module calcule le bilan de liaison pour les liaisons hertziennes (faisceaux radio), en déterminant les pertes en espace libre, la puissance reçue, la marge de liaison et la disponibilité du lien.

#### Paramètres d'entrée

| Paramètre | Description | Valeur typique | Plage recommandée | Unité |
|------------|-------------|----------------|-------------------|-------|
| `frequency` | Fréquence du faisceau hertzien. Les fréquences plus élevées offrent plus de bande passante mais sont plus sensibles aux conditions météorologiques. | 18 | 6-38 | GHz |
| `distance` | Distance entre les deux points de la liaison. Facteur crucial qui influence les pertes en espace libre. | 10 | 1-50 | km |
| `transmitPower` | Puissance du signal transmis par l'émetteur. Valeur plus élevée augmente la portée et la fiabilité mais aussi la consommation énergétique. | 20 | 10-30 | dBm |
| `antennaGain1` | Gain de l'antenne émettrice. Détermine la directivité et l'efficacité de l'antenne à concentrer l'énergie. | 30 | 20-45 | dBi |
| `antennaGain2` | Gain de l'antenne réceptrice. Généralement similaire à l'antenne émettrice pour une liaison point à point. | 30 | 20-45 | dBi |
| `losses` | Pertes diverses (connecteurs, câbles, désaccords d'impédance). Représente les pertes qui ne sont pas directement liées à la propagation. | 2 | 1-5 | dB |
| `modulationType` | Technique utilisée pour encoder l'information. Les modulations d'ordre supérieur (64QAM, 256QAM) offrent plus de débit mais nécessitent un meilleur rapport signal/bruit. | "QPSK" | BPSK, QPSK, 16QAM, 64QAM, 256QAM | - |
| `dataRate` | Débit de données requis pour la liaison. Détermine les besoins en bande passante et influence le choix de modulation. | 100 | 10-1000 | Mbps |
| `targetBER` | Taux d'erreur binaire cible. Définit le niveau de qualité de service requis. | 1e-6 | 1e-3 à 1e-12 | - |
| `bandwidthMHz` | Largeur de bande du canal. Limite le débit maximal et est réglementée par les autorités de télécommunication. | 20 | 7-56 | MHz |
| `rainZone` | Zone de pluviométrie selon la classification ITU-R. Détermine l'intensité des précipitations et leur impact sur la liaison. | "K" | A-Q (A=faible, Q=très forte) | - |
| `terrainType` | Type de terrain entre les points de liaison. Influence les pertes supplémentaires dues aux obstacles. | "AVERAGE" | FLAT, AVERAGE, HILLY, MOUNTAINOUS | - |
| `fresnelClearance` | Pourcentage de dégagement de la première zone de Fresnel. Un dégagement d'au moins 60% est recommandé pour éviter des pertes significatives. | 60 | 40-100 | % |
| `fogDensity` | Densité de brouillard ou de nuages bas. Pertinent surtout pour les fréquences supérieures à 20 GHz. | 0 | 0-0.5 | g/m³ |

#### Résultats de calcul

| Paramètre | Description | Interprétation | Unité |
|------------|-------------|-----------------|-------|
| `freeSpaceLoss` | Atténuation du signal en espace libre, dépendant principalement de la fréquence et de la distance. | Augmente de 6 dB chaque fois que la distance double ou que la fréquence double. Formule: 92.45 + 20log(f) + 20log(d) où f est en GHz et d en km. | dB |
| `rainLoss` | Atténuation supplémentaire due aux précipitations. | Dépend de la zone de pluviométrie, de la fréquence et de la distance. Impact majeur au-dessus de 10 GHz. | dB |
| `atmosphericLoss` | Pertes dues à l'absorption atmosphérique (vapeur d'eau, oxygène). | Généralement faible (<1 dB/km) sauf pour certaines fréquences spécifiques et sur de longues distances. | dB |
| `totalLoss` | Somme de toutes les pertes identifiées dans le trajet. | Représente l'atténuation totale que subit le signal entre l'émetteur et le récepteur. | dB |
| `receivedPower` | Niveau de puissance du signal au récepteur après avoir subi toutes les pertes. | Calculé comme: transmitPower + antennaGain1 + antennaGain2 - totalLoss - losses. Doit être supérieur au seuil de sensibilité du récepteur pour assurer la communication. | dBm |
| `systemGain` | Capacité théorique du système à compenser les pertes. | Égal à la puissance d'émission + gains d'antenne - sensibilité du récepteur. Plus cette valeur est élevée, plus la liaison peut couvrir de distance ou traverser des conditions difficiles. | dB |
| `linkMargin` | Marge de sécurité entre la puissance reçue et le seuil minimal requis. | Valeurs recommandées: >10 dB pour une très bonne liaison, 5-10 dB pour une liaison fiable, <5 dB pour une liaison marginale. | dB |
| `availability` | Pourcentage de temps pendant lequel la liaison sera opérationnelle. | Typiquement cible: 99.99% (52 min d'indisponibilité/an) à 99.999% (5 min/an). Dépend principalement des marges et des conditions climatiques. | % |
| `maxDistance` | Distance maximale théorique possible avec une marge de liaison nulle. | Utile pour évaluer si la liaison opère près de ses limites ou dispose d'une marge confortable. | km |

##### Seuils d'interprétation de la marge de liaison

| Marge (dB) | Qualité | Disponibilité typique | Recommandation |
|------------|----------|----------------------|----------------|
| > 15 | Excellente | > 99.999% | Idéal pour services critiques |
| 10-15 | Très bonne | 99.99% - 99.999% | Recommandé pour la plupart des applications |
| 5-10 | Acceptable | 99.9% - 99.99% | Suffisant pour applications non critiques |
| 3-5 | Marginale | 99.5% - 99.9% | Risque d'interruptions fréquentes |
| < 3 | Insuffisante | < 99.5% | Non recommandé pour déploiement |

##### Facteurs d'indisponibilité

* 99.9% = 8.76 heures d'indisponibilité/an
* 99.99% = 52.6 minutes d'indisponibilité/an
* 99.999% = 5.26 minutes d'indisponibilité/an

| Paramètre | Description | Interprétation | Unité |
|------------|-------------|-----------------|-------|
| `dataRateFeasible` | Indique si le débit demandé est réalisable avec les paramètres fournis | Une valeur "false" indique que le débit demandé n'est pas atteignable avec la configuration actuelle | boolean |
| `maxDataRate` | Débit maximal théorique possible avec la configuration donnée | Permet d'évaluer les limites de capacité de la liaison | Mbps |

#### Exemple de configuration

```json
{{ ... }}
{
  "frequency": 18,
  "distance": 7,
  "transmitPower": 20,
  "antennaGain1": 35,
  "antennaGain2": 35,
  "losses": 3,
  "modulationType": "64QAM",
  "dataRate": 200,
  "targetBER": "0.000001",
  "bandwidthMHz": 28,
  "rainZone": "K",
  "terrainType": "AVERAGE",
  "fresnelClearance": 70,
  "fogDensity": 0.05
}
```

### 4. Calculateur de Liaison Optique

#### Description
Ce module calcule le bilan de liaison pour les transmissions sur fibre optique en évaluant les pertes totales, le budget optique et la marge du système.

#### Paramètres d'entrée

| Paramètre | Description | Valeur typique | Plage recommandée | Unité |
|------------|-------------|----------------|-------------------|-------|
| `fiberType` | Type de fibre optique utilisée. Monomode pour longues distances, multimode pour courtes distances. | "MONOMODE" | MONOMODE, MULTIMODE | - |
| `wavelength` | Longueur d'onde du signal lumineux. Détermine l'atténuation intrinsèque et la dispersion. | 1310 | 850, 1310, 1550, 1625 | nm |
| `linkLength` | Distance totale de la liaison optique. Facteur principal dans le calcul des pertes. | 10 | 0.1-100 | km |
| `transmitterPower` | Puissance du signal émis par la source optique. Valeur plus élevée augmente la portée mais peut induire des effets non-linéaires. | 0 | -10 à +10 | dBm |
| `receiverSensitivity` | Niveau minimal de puissance détectable par le récepteur. Une valeur plus négative indique une meilleure sensibilité. | -30 | -40 à -20 | dBm |
| `connectorCount` | Nombre total de connecteurs sur le parcours optique. Chaque connecteur introduit des pertes. | 4 | 2-10 | - |
| `spliceCount` | Nombre d'épissures (jonctions permanentes) dans la fibre. Les épissures par fusion ont moins de pertes que les connecteurs. | 5 | 0-20 | - |
| `dataRate` | Débit de transmission requis. Affecte la sensibilité du récepteur et la tolérance à la dispersion. | 10 | 0.1-100 | Gbps |
| `spectralWidth` | Largeur spectrale de la source optique. Important pour évaluer la dispersion chromatique, surtout sur longues distances. | 1 | 0.1-10 | nm |
| `connectorLoss` | Perte moyenne par connecteur. Dépend de la qualité et du type de connecteur (SC, LC, FC, etc.). | 0.5 | 0.1-1.0 | dB |
| `spliceLoss` | Perte moyenne par épissure. Les épissures par fusion ont généralement des pertes inférieures à 0.1 dB. | 0.1 | 0.05-0.3 | dB |
| `safetyMargin` | Marge de sécurité pour tenir compte du vieillissement des composants et des conditions variables. | 3 | 2-6 | dB |
| `customLosses` | Pertes supplémentaires dues à des éléments spécifiques (filtres, multiplexeurs, etc.). | 0 | 0-5 | dB |

#### Types de fibre disponibles
- **MONOMODE** : Fibre monomode standard (ITU-T G.652)
- **MULTIMODE** : Fibre multimode (OM3/OM4)

#### Résultats de calcul

| Paramètre | Description | Interprétation | Unité |
|------------|-------------|-----------------|-------|
| `opticalBudget` | Différence entre la puissance d'émission et la sensibilité du récepteur. Représente la perte maximale tolérable sur la liaison. | Calculé comme: transmitterPower - receiverSensitivity. Plus cette valeur est élevée, plus la liaison peut être longue ou tolérer des pertes importantes. | dB |
| `fiberLoss` | Perte intrinsèque de la fibre dépendant de sa longueur et de son type. | Pour une fibre monomode: ~0.35 dB/km à 1310nm et ~0.25 dB/km à 1550nm. Pour une fibre multimode: ~0.8-3.0 dB/km selon la longueur d'onde. | dB |
| `connectorLosses` | Pertes totales introduites par tous les connecteurs sur le parcours. | Calculé comme: connectorCount * connectorLoss. Les connecteurs sont souvent les principales sources de perte après la fibre elle-même. | dB |
| `spliceLosses` | Pertes totales dues aux épissures sur le parcours. | Calculé comme: spliceCount * spliceLoss. Les épissures par fusion sont préférées aux connecteurs pour les jonctions permanentes car elles introduisent moins de pertes. | dB |
| `totalLosses` | Somme de toutes les pertes identifiées sur la liaison, incluant la marge de sécurité. | Calculé comme: fiberLoss + connectorLosses + spliceLosses + safetyMargin + customLosses. Doit être inférieur au budget optique pour que la liaison soit fonctionnelle. | dB |
| `linkMargin` | Différence entre le budget optique et les pertes totales. Indique la marge de sécurité réelle de la liaison. | Calculé comme: opticalBudget - totalLosses. Une valeur positive indique que la liaison est viable. Recommandé > 3 dB pour une liaison fiable. | dB |
| `maxDistance` | Distance maximale théorique possible avec la configuration actuelle. | Calculée en fonction du budget optique, des pertes par connecteurs et épissures, et de l'atténuation linéique de la fibre. | km |
| `dispersionLimit` | Limite de distance due à la dispersion chromatique. | Pertinent surtout pour les hauts débits (>10 Gbps) et les longues distances. La dispersion peut limiter la distance avant que l'atténuation ne devienne problématique. | km |
| `limitingFactor` | Indique si la liaison est limitée par l'atténuation ou par la dispersion. | Deux valeurs possibles: 'ATTENUATION' ou 'DISPERSION'. Pour les courtes distances et débits modérés, généralement 'ATTENUATION'. | - |

##### Seuils d'interprétation de la marge de liaison optique

| Marge (dB) | Qualité | Recommandation |
|------------|----------|-----------------|
| > 10 | Excellente | Idéal pour liens critiques ou avec évolution future |
| 6-10 | Très bonne | Recommandé pour la plupart des applications |
| 3-6 | Acceptable | Suffisant pour des applications stables |
| 1-3 | Marginale | Risque de dégradation avec le vieillissement |
| < 1 | Insuffisante | Non viable, redesign nécessaire |

#### Exemple de configuration

```json
{
  "fiberType": "MONOMODE",
  "linkLength": 30,
  "wavelength": 1550,
  "transmitterPower": 3,
  "receiverSensitivity": -32,
  "connectorCount": 6,
  "spliceCount": 8,
  "bitRate": 10,
  "spectralWidth": 0.1,
  "connectorLoss": 0.5,
  "spliceLoss": 0.1,
  "safetyMargin": 3
}
```

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

## Visualisations et Exports

### Visualisations graphiques

L'application offre des visualisations graphiques adaptées à chaque type de réseau:

#### GSM
- Graphiques en anneau montrant la répartition des BTS (couverture vs capacité)
- Diagrammes en bâtons comparant les canaux requis par secteur
- Indicateurs de performance avec jauges colorisées

#### UMTS
- Graphiques radar comparant les paramètres clés (capacité montante/descendante, débits)
- Graphiques en anneau montrant le facteur limitant (uplink/downlink)
- Diagrammes en bâtons pour les capacités utilisateurs par service

#### Hertzien
- Graphiques linéaires de l'atténuation en fonction de la distance
- Visualisation de la marge de liaison et de la disponibilité
- Indicateurs de qualité de liaison (excellent, acceptable, insuffisant)

#### Optique
- Diagramme en cascade des différentes sources de pertes
- Graphique du budget optique et de la marge de sécurité
- Indicateur de limitation (atténuation vs dispersion)

### Export de résultats

L'application propose l'export des résultats dans plusieurs formats:

#### Export Excel
Les exports Excel contiennent des feuilles détaillées avec:
- Tous les paramètres d'entrée utilisés
- Les résultats calculés structurés par sections
- Les paramètres avancés (si disponibles)

Structure type d'un export Excel:
```
=== PARAMÈTRES DE DIMENSIONNEMENT ===
Zone de couverture: 100 km²
Nombre d'utilisateurs: 50000 utilisateurs
...

=== RÉSULTATS DE COUVERTURE ===
Rayon de cellule: 5.69 km
...

=== RÉSULTATS DE CAPACITÉ ===
Nombre de canaux: 52
...
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
