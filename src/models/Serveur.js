const pool = require("../config/db"); // importer connexion bdd

class Serveur {
    static STATUTS = ["en service", "maintenance", "hors service"];

    // Filtres optionnels : idDatacenter, statut, libre (true = sans abonnement, false = attribué)
    static async findAll({ idDatacenter, statut, libre } = {}) {
        const conditions = [];
        const valeurs = [];

        if (idDatacenter) {
            valeurs.push(idDatacenter);
            conditions.push(`s.id_datacenter = $${valeurs.length}`);
        }
        if (statut) {
            valeurs.push(statut);
            conditions.push(`s.statut = $${valeurs.length}`);
        }
        if (libre === true) {
            conditions.push("a.id_abonnement IS NULL");
        }
        if (libre === false) {
            conditions.push("a.id_abonnement IS NOT NULL");
        }

        const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

        const { rows } = await pool.query(
            `SELECT s.id_serveur, s.nom_hote, s.adresse_ip, s.statut, s.date_mise_en_service,
                    s.id_datacenter, (a.id_abonnement IS NULL) AS libre
             FROM serveur s
             LEFT JOIN abonnement a ON a.id_serveur = s.id_serveur
             ${where}
             ORDER BY s.nom_hote`,
            valeurs
        );
        return rows;
    }

    static async findById(id){
        const resultat = await pool.query(
            "SELECT * FROM public.serveur WHERE id_serveur=$1",
            [id]
        );
        return resultat.rows[0];
    }

    static async create(donnees){
        const resultat = await pool.query(
            "INSERT INTO public.serveur (nom_hote,adresse_ip,statut,date_mise_en_service,id_datacenter) VALUES($1,$2,$3,$4,$5) RETURNING*",
            [
            donnees.nom_hote,
            donnees.adresse_ip,
            donnees.statut,
            donnees.date_mise_en_service,
            donnees.id_datacenter
            ]
        );
        return resultat.rows[0];
    }

    static async update(id,donnees){
        const resultat = await pool.query(
            "Update public.serveur SET nom_hote = $1, adresse_ip = $2, statut= $3, date_mise_en_service = $4, id_datacenter= $5  WHERE id_serveur = $6 RETURNING*",
            [
            donnees.nom_hote,
            donnees.adresse_ip,
            donnees.statut,
            donnees.date_mise_en_service,
            donnees.id_datacenter,
            id
            ],
        )
        return resultat.rows[0];
    }

    static async delete(id){
        const resultat = await pool.query(
            "DELETE FROM public.serveur WHERE id_serveur = $1 RETURNING*",
            [id],
        )
        return resultat.rows[0];
    }
}

module.exports = Serveur;
