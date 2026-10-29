const { Schema, model } = require("mongoose");

// Un document par événement. Le champ "type" choisit le discriminator, donc les champs attendus.
const evenementSchema = new Schema(
    {
        serveurId: { type: Number, required: true }, // id PostgreSQL du serveur
        date: { type: Date, default: Date.now },
    },
    { discriminatorKey: "type", strict: "throw" }
);

// Lecture du plus récent au plus ancien pour un serveur
evenementSchema.index({ serveurId: 1, date: -1 });

const Evenement = model("Evenement", evenementSchema, "evenements");

const pourcentage = { type: Number, required: true, min: 0, max: 100 };

Evenement.discriminator("redemarrage", new Schema({
    motif: { type: String, required: true, trim: true },
}, { strict: "throw" }));

Evenement.discriminator("alerte", new Schema({
    niveau: { type: String, required: true, enum: ["info", "avertissement", "critique"] },
    message: { type: String, required: true, trim: true },
}, { strict: "throw" }));

Evenement.discriminator("maintenance", new Schema({
    description: { type: String, required: true, trim: true },
    dureeMinutes: { type: Number, required: true, min: 1 },
}, { strict: "throw" }));

Evenement.discriminator("metrique", new Schema({
    cpu: pourcentage,
    ram: pourcentage,
    disque: pourcentage,
}, { strict: "throw" }));

Evenement.TYPES = ["redemarrage", "alerte", "maintenance", "metrique"];

module.exports = Evenement;
