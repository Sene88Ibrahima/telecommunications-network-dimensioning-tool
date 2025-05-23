-- Script de configuration de la base de données PostgreSQL
-- À exécuter avec l'utilisateur postgres (administrateur)

-- Création de la base de données
CREATE DATABASE telecom_dimensioning;

-- Création de l'utilisateur
CREATE USER telecom_user WITH ENCRYPTED PASSWORD 'telecom_password';

-- Attribution des privilèges
GRANT ALL PRIVILEGES ON DATABASE telecom_dimensioning TO telecom_user;

-- Se connecter à la base de données
\c telecom_dimensioning

-- Accorder les privilèges sur le schéma public
GRANT ALL ON SCHEMA public TO telecom_user;
