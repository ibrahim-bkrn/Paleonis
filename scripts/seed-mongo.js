// Jeu d'essai MongoDB, cohérent avec les ids de database/seed.sql.
// Rejouable : vide les collections puis les remplit. Lancer avec : node scripts/seed-mongo.js
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const FicheTechnique = require("../src/models/FicheTechnique");
const Evenement = require("../src/models/Evenement");
const FilTicket = require("../src/models/FilTicket");

// Une fiche par offre (offres 1 à 8 de seed.sql)
const fiches = [
    { offreId: 1, categorie: "VPS", vcpu: 1, ramGo: 2, stockage: { type: "SSD", tailleGo: 40 }, os: ["Ubuntu 24.04", "Debian 12"] },
    { offreId: 2, categorie: "VPS", vcpu: 4, ramGo: 8, stockage: { type: "NVMe", tailleGo: 160 }, os: ["Ubuntu 24.04", "Debian 12", "Rocky Linux 9"], autres: { ipv6: true, sauvegardeQuotidienne: true } },
    { offreId: 3, categorie: "hebergement mutualise", espaceDisqueGo: 10, nbSites: 1, nbBasesDeDonnees: 2, certificatSsl: true },
    { offreId: 4, categorie: "hebergement mutualise", espaceDisqueGo: 100, nbSites: 10, nbBasesDeDonnees: 20, certificatSsl: true, autres: { cdn: true, emailsPro: 50 } },
    { offreId: 5, categorie: "serveur dedie", processeur: "Intel Xeon E-2386G", ramGo: 64, disques: [{ type: "NVMe", tailleGo: 1000 }, { type: "NVMe", tailleGo: 1000 }], bandePassanteGbps: 1 },
    { offreId: 6, categorie: "serveur dedie", processeur: "AMD EPYC 9354P", ramGo: 256, disques: [{ type: "NVMe", tailleGo: 3840 }, { type: "NVMe", tailleGo: 3840 }, { type: "HDD", tailleGo: 16000 }], bandePassanteGbps: 10, autres: { raid: "RAID 1", antiDdos: true } },
    { offreId: 7, categorie: "nom de domaine", extension: ".fr", registrar: "AFNIC", dureeEngagementMois: 12 },
    { offreId: 8, categorie: "VPS", vcpu: 1, ramGo: 1, stockage: { type: "HDD", tailleGo: 20 }, os: ["Debian 11"], autres: { finDeSupport: "2026-12-31" } },
];

// Événements : 9 serveurs attribués x 7 jours = 63 événements, du 21 au 27 octobre 2026
const serveurs = [1, 2, 3, 4, 9, 10, 15, 16, 17];
const exemples = [
    { type: "metrique", cpu: 35, ram: 60, disque: 72 },
    { type: "alerte", niveau: "avertissement", message: "CPU au-dessus de 85 % pendant 10 minutes" },
    { type: "metrique", cpu: 12, ram: 41, disque: 73 },
    { type: "redemarrage", motif: "Mise à jour du noyau" },
    { type: "alerte", niveau: "critique", message: "Disque rempli à 95 %" },
    { type: "maintenance", description: "Remplacement d'un disque défectueux", dureeMinutes: 45 },
    { type: "metrique", cpu: 88, ram: 92, disque: 95 },
];
const evenements = [];
serveurs.forEach((serveurId, s) => {
    for (let jour = 0; jour < 7; jour++) {
        const date = new Date(Date.UTC(2026, 9, 21 + jour, 8 + s, 15));
        evenements.push({ serveurId, date, ...exemples[(s + jour) % exemples.length] });
    }
});

// Fils de messages, cohérents avec les clients et techniciens des tickets de seed.sql
const message = (type, id, contenu, date, piecesJointes = []) =>
    ({ auteur: { type, id }, contenu, date: new Date(date), piecesJointes });

const fils = [
    { ticketId: 1, messages: [
        message("client", 1, "Mon VPS ne répond plus, voici la capture.", "2026-10-27T08:20:00Z",
            [{ nom: "erreur.png", url: "https://files.paleonis.fr/t1/erreur.png" }]),
        message("technicien", 1, "Je regarde, redémarrage en cours.", "2026-10-27T08:45:00Z"),
        message("client", 1, "Toujours injoignable.", "2026-10-27T09:30:00Z"),
    ] },
    { ticketId: 2, messages: [
        message("client", 3, "Les pages mettent plus de 10 secondes à charger.", "2026-10-26T14:35:00Z"),
        message("technicien", 3, "La RAM est saturée, nous analysons.", "2026-10-26T16:00:00Z"),
    ] },
    { ticketId: 4, messages: [
        message("client", 6, "Le disque est presque plein.", "2026-10-10T09:50:00Z"),
        message("technicien", 4, "Disque nettoyé, 40 % libre.", "2026-10-10T11:20:00Z",
            [{ nom: "rapport.pdf", url: "https://files.paleonis.fr/t4/rapport.pdf" }]),
        message("client", 6, "Merci, tout fonctionne.", "2026-10-10T12:00:00Z"),
    ] },
    { ticketId: 5, messages: [
        message("client", 4, "Pouvez-vous planifier la mise à jour ?", "2026-09-02T16:25:00Z"),
        message("technicien", 3, "Mise à jour faite cette nuit, je ferme le ticket.", "2026-09-03T07:00:00Z"),
    ] },
    { ticketId: 6, messages: [
        message("client", 7, "Pourquoi mon hébergement est-il suspendu ?", "2026-10-20T11:15:00Z"),
        message("technicien", 2, "Un paiement est en échec, voir la facture jointe.", "2026-10-20T14:00:00Z",
            [{ nom: "facture-octobre.pdf", url: "https://files.paleonis.fr/t6/facture-octobre.pdf" }]),
    ] },
    { ticketId: 9, messages: [
        message("client", 10, "Merci de redémarrer le serveur ce soir.", "2026-08-14T20:05:00Z"),
        message("technicien", 1, "Redémarrage effectué à 22 h.", "2026-08-14T22:10:00Z"),
    ] },
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);

    await FicheTechnique.deleteMany({});
    await FicheTechnique.insertMany(fiches);
    console.log(`${fiches.length} fiches techniques insérées`);

    await Evenement.deleteMany({});
    await Evenement.insertMany(evenements);
    console.log(`${evenements.length} événements insérés`);

    await FilTicket.deleteMany({});
    await FilTicket.insertMany(fils);
    console.log(`${fils.length} fils de messages insérés`);

    await mongoose.disconnect();
}

seed().catch(async (erreur) => {
    console.error("Erreur pendant le seed :", erreur.message);
    await mongoose.disconnect();
    process.exit(1);
});
