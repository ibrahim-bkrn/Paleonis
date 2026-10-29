const net = require("net");
const Serveur = require("../models/Serveur");
const Evenement = require("../models/Evenement");

// Renvoie l'id sous forme de nombre s'il est valide, sinon null
function lireId(valeur) {
    const id = Number(valeur);
    return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

function estTexteRempli(valeur) {
    return typeof valeur === "string" && valeur.trim() !== "";
}

// Vérifie qu'une date est au format AAAA-MM-JJ et qu'elle existe (pas de 30 février)
function estDateValide(valeur) {
    if (typeof valeur !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
        return false;
    }
    const date = new Date(valeur);
    return !isNaN(date) && date.toISOString().slice(0, 10) === valeur;
}

// Vérifie le body d'un serveur (POST et PUT) : renvoie { code, message } si invalide, sinon null
function verifierServeur(donnees) {
    const { nom_hote, adresse_ip, statut, date_mise_en_service, id_datacenter } = donnees ?? {};

    if (!estTexteRempli(nom_hote) || !estTexteRempli(adresse_ip) || !statut || !date_mise_en_service || id_datacenter === undefined) {
        return { code: 400, message: "Champs obligatoires : nom_hote, adresse_ip, statut, date_mise_en_service, id_datacenter" };
    }
    if (!lireId(id_datacenter)) {
        return { code: 400, message: "id_datacenter doit être un entier positif" };
    }
    if (nom_hote.trim().length > 255) {
        return { code: 422, message: "Le nom d'hôte ne doit pas dépasser 255 caractères" };
    }
    if (!net.isIP(adresse_ip)) {
        return { code: 422, message: "Adresse IP invalide" };
    }
    if (!Serveur.STATUTS.includes(statut)) {
        return { code: 422, message: `Statut invalide. Valeurs autorisées : ${Serveur.STATUTS.join(", ")}` };
    }
    if (!estDateValide(date_mise_en_service)) {
        return { code: 422, message: "date_mise_en_service doit être une date valide au format AAAA-MM-JJ" };
    }
    return null;
}

class ServeurController {
    // GET /api/servers?datacenter=1&statut=en service&libre=true
    static async getAll(req, res){
        try{
            const { datacenter, statut, libre } = req.query;
            const Serveurs = await Serveur.findAll({
                idDatacenter: datacenter ? Number(datacenter) : null,
                statut: statut || null,
                libre: libre === "true" ? true : libre === "false" ? false : null,
            });
            res.json(Serveurs);
        } catch(erreur){
            res.status(500).json({ erreur: "Erreur serveur" })
        }
    }

    static async getById(req, res){
        try{
            const id = lireId(req.params.id);
            if(!id){
                return res.status(400).json({ erreur: "Id de serveur invalide" });
            }
            const Serveurs = await Serveur.findById(id);
            if(!Serveurs){
                return res.status(404).json({ erreur: "Serveur introuvable" });
            }
            res.json(Serveurs)
        } catch(erreur){
            res.status(500).json({ erreur: "Erreur serveur" })
        }
    }

    static async create(req, res){
        try{
            const donnees = req.body;
            const invalide = verifierServeur(donnees);
            if(invalide){
                return res.status(invalide.code).json({ erreur: invalide.message });
            }
            const Serveurs = await Serveur.create(donnees);
            res.status(201).json(Serveurs);
        }catch(erreur){
            // 23505 : nom d'hôte ou adresse IP déjà utilisé par un autre serveur
            if(erreur.code === "23505"){
                return res.status(409).json({ erreur: "Nom d'hôte ou adresse IP déjà utilisé" });
            }
            // 23503 : clé étrangère vers un datacenter qui n'existe pas
            if(erreur.code === "23503"){
                return res.status(404).json({ erreur: "Datacenter introuvable" });
            }
            res.status(500).json({ erreur: "Erreur serveur" });
        }
    }

    static async update(req, res){
        try{
            const id = lireId(req.params.id);
            if(!id){
                return res.status(400).json({ erreur: "Id de serveur invalide" });
            }
            const donnees = req.body;
            const invalide = verifierServeur(donnees);
            if(invalide){
                return res.status(invalide.code).json({ erreur: invalide.message });
            }
            const Serveurs = await Serveur.update(id,donnees);
            if(!Serveurs){
                return res.status(404).json({ erreur: "Serveur introuvable" });
            }
            res.json(Serveurs)
        }catch(erreur){
            // 23505 : nom d'hôte ou adresse IP déjà utilisé par un autre serveur
            if(erreur.code === "23505"){
                return res.status(409).json({ erreur: "Nom d'hôte ou adresse IP déjà utilisé" });
            }
            // 23503 : clé étrangère vers un datacenter qui n'existe pas
            if(erreur.code === "23503"){
                return res.status(404).json({ erreur: "Datacenter introuvable" });
            }
            res.status(500).json({ erreur: "Erreur serveur" });
        }
    }

    static async delete(req, res){
        try{
            const id = lireId(req.params.id);
            if(!id){
                return res.status(400).json({ erreur: "Id de serveur invalide" });
            }
            const Serveurs = await Serveur.delete(id);
            if(!Serveurs){
                return res.status(404).json({ erreur: "Serveur introuvable" });
            }
            res.status(200).json({message: "Supprimée avec succès"});
        }catch(erreur){
            // 23001 (ON DELETE RESTRICT) ou 23503 (sans ON DELETE) : le serveur est encore rattaché à un abonnement
            if(erreur.code === "23001" || erreur.code === "23503"){
                return res.status(409).json({ erreur: "Serveur attribué à un abonnement, suppression impossible" });
            }
            res.status(500).json({ erreur: "Erreur serveur" });
        }
    }

    // POST /api/servers/:id/events
    static async createEvenement(req, res, next){
        try{
            const id = lireId(req.params.id);
            if(!id){
                return res.status(400).json({ erreur: "Id de serveur invalide" });
            }
            const { type, serveurId, _id, ...infos } = req.body ?? {};
            if(!Evenement.TYPES.includes(type)){
                return res.status(422).json({ erreur: `Type invalide. Valeurs autorisées : ${Evenement.TYPES.join(", ")}` });
            }
            // MongoDB ne connaît pas les serveurs : on vérifie dans PostgreSQL
            if(!(await Serveur.findById(id))){
                return res.status(404).json({ erreur: "Serveur introuvable" });
            }
            const evenement = await Evenement.discriminators[type].create({ ...infos, serveurId: id });
            res.status(201).json(evenement);
        }catch(erreur){
            next(erreur);
        }
    }

    // GET /api/servers/:id/events?type=alerte&debut=2026-10-01&fin=2026-10-31&limite=20
    static async listEvenements(req, res, next){
        try{
            const id = lireId(req.params.id);
            if(!id){
                return res.status(400).json({ erreur: "Id de serveur invalide" });
            }
            const { type, debut, fin, limite } = req.query;
            const filtre = { serveurId: id };

            if(type){
                if(!Evenement.TYPES.includes(type)){
                    return res.status(400).json({ erreur: `Type invalide. Valeurs autorisées : ${Evenement.TYPES.join(", ")}` });
                }
                filtre.type = type;
            }
            if(debut || fin){
                filtre.date = {};
                if(debut) filtre.date.$gte = new Date(debut);
                if(fin){
                    filtre.date.$lte = new Date(fin);
                    // fin=2026-10-27 inclut toute la journée du 27
                    if(/^\d{4}-\d{2}-\d{2}$/.test(fin)) filtre.date.$lte.setUTCHours(23, 59, 59, 999);
                }
                if(Object.values(filtre.date).some((d) => isNaN(d))){
                    return res.status(400).json({ erreur: "debut et fin doivent être des dates valides (AAAA-MM-JJ)" });
                }
            }
            const nb = limite === undefined ? 50 : Number(limite);
            if(!Number.isInteger(nb) || nb < 1 || nb > 500){
                return res.status(400).json({ erreur: "limite doit être un entier entre 1 et 500" });
            }

            if(!(await Serveur.findById(id))){
                return res.status(404).json({ erreur: "Serveur introuvable" });
            }
            const evenements = await Evenement.find(filtre).sort({ date: -1 }).limit(nb);
            res.json(evenements);
        }catch(erreur){
            next(erreur);
        }
    }

    // GET /api/servers/:id/events/stats : nombre d'événements par type, calculé par MongoDB
    static async statsEvenements(req, res, next){
        try{
            const id = lireId(req.params.id);
            if(!id){
                return res.status(400).json({ erreur: "Id de serveur invalide" });
            }
            if(!(await Serveur.findById(id))){
                return res.status(404).json({ erreur: "Serveur introuvable" });
            }
            const stats = await Evenement.aggregate([
                { $match: { serveurId: id } },
                { $group: { _id: "$type", total: { $sum: 1 } } },
                { $project: { _id: 0, type: "$_id", total: 1 } },
                { $sort: { total: -1 } },
            ]);
            res.json({ serveurId: id, stats });
        }catch(erreur){
            next(erreur);
        }
    }
}

module.exports = ServeurController;
