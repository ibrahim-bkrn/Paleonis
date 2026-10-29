const { Schema, model } = require("mongoose");

// Une fiche par offre. Le champ "categorie" choisit le discriminator, donc les champs obligatoires.
// strict: "throw" refuse les champs inconnus au lieu de les ignorer : les nouvelles caractéristiques vont dans "autres".
const ficheSchema = new Schema(
    {
        offreId: { type: Number, required: true, unique: true }, // id PostgreSQL de l'offre
        autres: { type: Schema.Types.Mixed, default: {} },
    },
    { discriminatorKey: "categorie", timestamps: true, strict: "throw" }
);

const FicheTechnique = model("FicheTechnique", ficheSchema, "fiches_techniques");

const disqueSchema = new Schema(
    {
        type: { type: String, required: true, enum: ["HDD", "SSD", "NVMe"] },
        tailleGo: { type: Number, required: true, min: 1 },
    },
    { _id: false, strict: "throw" }
);

const auMoinsUn = [(tableau) => tableau.length > 0, "Au moins une valeur est attendue"];

FicheTechnique.discriminator("VPS", new Schema({
    vcpu: { type: Number, required: true, min: 1 },
    ramGo: { type: Number, required: true, min: 1 },
    stockage: { type: disqueSchema, required: true },
    os: { type: [String], validate: auMoinsUn },
}, { strict: "throw" }));

FicheTechnique.discriminator("hebergement mutualise", new Schema({
    espaceDisqueGo: { type: Number, required: true, min: 1 },
    nbSites: { type: Number, required: true, min: 1 },
    nbBasesDeDonnees: { type: Number, required: true, min: 0 },
    certificatSsl: { type: Boolean, required: true },
}, { strict: "throw" }));

FicheTechnique.discriminator("serveur dedie", new Schema({
    processeur: { type: String, required: true, trim: true },
    ramGo: { type: Number, required: true, min: 1 },
    disques: { type: [disqueSchema], validate: auMoinsUn },
    bandePassanteGbps: { type: Number, required: true, min: 0.1 },
}, { strict: "throw" }));

FicheTechnique.discriminator("nom de domaine", new Schema({
    extension: { type: String, required: true, match: [/^\.[a-z]{2,}$/, "Extension invalide (ex : .fr)"] },
    registrar: { type: String, required: true, trim: true },
    dureeEngagementMois: { type: Number, required: true, min: 1 },
}, { strict: "throw" }));

module.exports = FicheTechnique;
