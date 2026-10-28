const net = require("net");
const Serveur = require("../models/Serveur");

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
}

module.exports = ServeurController;
