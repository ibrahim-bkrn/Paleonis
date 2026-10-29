# Endpoints ajoutés au TP 4

Les endpoints du TP 3 sont inchangés (voir le contrat d'API dans `docs/`).

## N1. Fiches techniques (`/api/catalog`)

| Méthode | URL | Rôle | Codes |
|---|---|---|---|
| GET | `/api/catalog/:id` | Offre (PostgreSQL) + `fiche_technique` (MongoDB) en une réponse | 200, 400, 404 |
| GET | `/api/catalog/:id/fiche` | Fiche technique seule | 200, 400, 404 |
| PUT | `/api/catalog/:id/fiche` | Crée (201) ou remplace (200) la fiche, validée selon la catégorie de l'offre | 200, 201, 400, 404, 422 |
| DELETE | `/api/catalog/:id` | Supprime l'offre, puis sa fiche | 200, 404, 409 |

Champs obligatoires par catégorie (tout le reste va dans `autres`) :
- `VPS` : `vcpu`, `ramGo`, `stockage { type, tailleGo }`, `os[]`
- `hebergement mutualise` : `espaceDisqueGo`, `nbSites`, `nbBasesDeDonnees`, `certificatSsl`
- `serveur dedie` : `processeur`, `ramGo`, `disques[]`, `bandePassanteGbps`
- `nom de domaine` : `extension`, `registrar`, `dureeEngagementMois`

## N2. Journal d'activité (`/api/servers`)

| Méthode | URL | Rôle | Codes |
|---|---|---|---|
| POST | `/api/servers/:id/events` | Enregistre un événement | 201, 400, 404, 422 |
| GET | `/api/servers/:id/events?type=&debut=&fin=&limite=` | Événements du plus récent au plus ancien (`limite` : 50 par défaut, 500 max) | 200, 400, 404 |
| GET | `/api/servers/:id/events/stats` | Nombre d'événements par type (`aggregate`) | 200, 400, 404 |

Champs selon le `type` :
- `redemarrage` : `motif`
- `alerte` : `niveau` (`info`, `avertissement` ou `critique`), `message`
- `maintenance` : `description`, `dureeMinutes`
- `metrique` : `cpu`, `ram`, `disque` (en %)

## N3. Échanges sur les tickets (`/api/tickets`)

| Méthode | URL | Rôle | Codes |
|---|---|---|---|
| GET | `/api/tickets/:id` | Ticket + `messages` dans l'ordre chronologique | 200, 400, 404 |
| POST | `/api/tickets/:id/messages` | Ajoute un message : `auteur { type: client\|technicien, id }`, `contenu`, `piecesJointes[] { nom, url }` | 201, 400, 403, 404, 409, 422 |

- 403 : le client n'est pas celui du ticket.
- 404 : le ticket ou le technicien n'existe pas.
- 409 : le ticket est fermé.
