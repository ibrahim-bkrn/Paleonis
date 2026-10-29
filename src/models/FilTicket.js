const { Schema, model } = require("mongoose");

// Un document par ticket, messages imbriqués : le fil entier se lit en une seule requête
const messageSchema = new Schema(
    {
        auteur: {
            type: { type: String, required: true, enum: ["client", "technicien"] },
            id: { type: Number, required: true }, // id PostgreSQL du client ou du technicien
        },
        contenu: { type: String, required: true, trim: true, maxlength: 5000 },
        date: { type: Date, default: Date.now },
        piecesJointes: [
            new Schema({
                nom: { type: String, required: true, trim: true },
                url: { type: String, required: true, match: [/^https?:\/\//, "URL invalide"] },
            }, { _id: false, strict: "throw" }),
        ],
    },
    { strict: "throw" }
);

const filTicketSchema = new Schema(
    {
        ticketId: { type: Number, required: true, unique: true }, // id PostgreSQL du ticket
        messages: [messageSchema],
    },
    { strict: "throw" }
);

module.exports = model("FilTicket", filTicketSchema, "fils_tickets");
