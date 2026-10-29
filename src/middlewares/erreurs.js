// Middleware d'erreurs global : traduit les erreurs Mongo en codes HTTP. Il reste TOUJOURS en dernier.
function gererErreurs(erreur, req, res, next) {
    // Le document ne respecte pas le schéma Mongoose
    if (erreur.name === "ValidationError") {
        const details = Object.values(erreur.errors).map((e) => e.message);
        return res.status(422).json({ erreur: "Données invalides", details });
    }
    // Champ inconnu refusé par strict: "throw"
    if (erreur.name === "StrictModeError") {
        return res.status(422).json({ erreur: `Champ non autorisé : ${erreur.path}` });
    }
    // Id qui n'a pas le format d'un ObjectId, ou valeur du mauvais type
    if (erreur.name === "CastError") {
        return res.status(400).json({ erreur: `Valeur invalide pour ${erreur.path}` });
    }
    // Valeur déjà existante sur un index unique
    if (erreur.code === 11000) {
        return res.status(409).json({ erreur: "Ce document existe déjà" });
    }
    // JSON mal formé dans le body
    if (erreur.type === "entity.parse.failed") {
        return res.status(400).json({ erreur: "JSON invalide" });
    }
    console.error(erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
}

module.exports = gererErreurs;
