# Configuration de la base de données PostgreSQL

Ce document explique comment configurer et initialiser la base de données PostgreSQL pour le projet d'Outil de Dimensionnement des Réseaux de Télécommunications.

## Prérequis

- PostgreSQL installé sur votre machine
- Accès administrateur à PostgreSQL

## Étapes de configuration

### 1. Exécution du script d'initialisation

Le fichier `setup_postgres.sql` contient toutes les instructions nécessaires pour créer la base de données et l'utilisateur.

```bash
# Se connecter en tant qu'administrateur PostgreSQL
psql -U postgres -f setup_postgres.sql
```

Si vous êtes sur Windows et que psql n'est pas dans le PATH, utilisez le chemin complet :

```bash
"C:\Program Files\PostgreSQL\[version]\bin\psql.exe" -U postgres -f setup_postgres.sql
```

### 2. Vérification de la configuration

Pour vérifier que la base de données a été correctement créée :

```bash
psql -U telecom_user -d telecom_dimensioning -c "\l"
```

### 3. Initialisation de la base de données

Pour initialiser la structure de la base de données lors du premier démarrage, assurez-vous que `FORCE_DB_SYNC=true` est défini dans le fichier `.env` du backend, puis démarrez le serveur normalement. Une fois la structure créée, remettez cette valeur à `false` pour éviter de perdre vos données.

## Troubleshooting

### Erreur de connexion

Si vous rencontrez des erreurs de connexion :

1. Vérifiez que PostgreSQL est en cours d'exécution
2. Assurez-vous que les informations d'identification dans le fichier `.env` sont correctes
3. Vérifiez que l'utilisateur a les permissions nécessaires

### Réinitialisation complète

Si vous avez besoin de réinitialiser complètement la base de données :

```sql
DROP DATABASE IF EXISTS telecom_dimensioning;
```

Puis réexécutez le script de configuration.
