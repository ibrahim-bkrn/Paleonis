# PaLeonis

TP 4 – Conception et développement back-end

## 1. Tableau de décision

| Donnée | Base | Critère décisif | Forme retenue |
| --- | --- | --- | --- |
| Fiche technique d'une offre | MongoDB | Structure variable selon la catégorie, évolutive sans migration | 1 document par offre |
| Événement serveur | MongoDB | Fort volume d'écriture, jamais modifié, champs variables selon le type | 1 document par événement |
| Message de ticket | MongoDB | Fil lu en entier d'un coup, pièces jointes en tableau | 1 document par ticket, messages imbriqués |

Le reste (clients, abonnements, offres, serveurs, tickets) reste dans PostgreSQL : liens forts, intégrité, transactions.

## 2. Modèles de documents

pour offre

```json
{ 
	"offreId": 2, 
	"categorie": "VPS", 
	"vcpu": 4, 
	"ramGo": 8,
  "stockage": { "type": "NVMe", "tailleGo": 160 }, "os": ["Ubuntu 24.04"],
  "autres": { "ipv6": true } 
 }
```

pour les serveurs

```json
{ 
	"serveurId": 15, 
	"type": "alerte", 
	"date": "2026-10-10T09:40:00Z",
  "niveau": "critique", 
  "message": "Disque rempli à 95 %" 
  }
```

pour les tickets

```json
{ 
	"ticketId": 1, 
	"messages": [
	  { "auteur": { "type": "client", "id": 1 }, "contenu": "Mon VPS ne répond plus.",
    "date": "2026-10-27T08:20:00Z", "piecesJointes": [{ "nom": "erreur.png", "url": "https://files.paleonis.fr/t1/erreur.png" }] },
	  { "auteur": { "type": "technicien", "id": 1 }, "contenu": "Redémarrage en cours.",
    "date": "2026-10-27T08:45:00Z", "piecesJointes": [] } 
	] 
}
```

## 3. Entre les deux bases

1.C’est L'API qui vérifie si le serveur ou l’offre existe, en interrogeant PostgreSQL. 

2.On supprime d'abord dans PostgreSQL ; si la suppression est refusée, on ne touche pas à MongoDB.

- Pour l’offre sa fiche est supprimée, elle n'a pas de sens sans l'offre.
- Pour le serveurs, ses événements sont conservés, comme historique et pour l'audit.
- Et le ticket son fil est supprimé.
