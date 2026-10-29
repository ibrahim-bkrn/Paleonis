# Paleonis

API Express de PaLeonis, avec deux bases :
- **PostgreSQL** pour les clients, offres, abonnements, serveurs et tickets ;
- **MongoDB** pour les fiches techniques, le journal des serveurs et les messages des tickets.

## Prérequis

- Node.js
- PostgreSQL (port 5432)
- MongoDB Community Server (port 27017), avec MongoDB Compass ou mongosh pour voir les données

## Installation

```bash
npm install
```

Copier `.env.example` en `.env` et le remplir :

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=paleonis
MONGO_URI=mongodb://localhost:27017/paleonis
```

## Charger les jeux d'essai

PostgreSQL (créer d'abord la base `paleonis`) :

```bash
psql -U postgres -d paleonis -f database/schema.sql
psql -U postgres -d paleonis -f database/seed.sql
```

MongoDB (après le seed PostgreSQL, les ids correspondent) :

```bash
node scripts/seed-mongo.js
```

Les deux seeds sont rejouables : ils vident les données puis les recréent.

## Lancer l'API

```bash
npm run dev
```

Le terminal doit afficher `Connecté à MongoDB` et `Connecté à PostgreSQL !`. Si MongoDB est injoignable, l'API s'arrête.

## Documentation

- `docs/arbitrage.md` : quelle donnée va dans quelle base, et pourquoi.
- `docs/endpoints.md` : les endpoints ajoutés au TP 4.
- `docs/paleonis-tp4.postman_collection.json` : collection Postman à importer.
