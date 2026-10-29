require("dotenv").config();
const pool = require("./config/db");
const connectMongo = require("./config/mongo");
const gererErreurs = require("./middlewares/erreurs");

const express = require("express");
const app = express();

pool.query("SELECT NOW()")
    .then(() => {
        console.log("Connecté à PostgreSQL !");
    })
    .catch((erreur) => {
        console.error("Erreur de connexion :", erreur.message);
    });

const productRoutes = require("./routes/product.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const datacenterRoutes = require("./routes/datacenterRoutes");
const technicienRoutes = require("./routes/technicienRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const offreRoutes = require("./routes/offreRoutes");
const serveurRoutes = require("./routes/serveurRoutes");

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes); 
app.use("/api/datacenters", datacenterRoutes);
app.use("/api/technicians", technicienRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/catalog", offreRoutes);
app.use("/api/servers", serveurRoutes);

// Le 404 reste TOUJOURS en dernier
app.use((req, res) => {
    res.status(404).json({ message: "Page introuvable" });
});

app.use(gererErreurs);

// Une API à moitié connectée est pire qu'une API éteinte : sans MongoDB, on arrête tout
connectMongo()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Serveur lance sur le port ${process.env.PORT || 3000}`);
        });
    })
    .catch((erreur) => {
        console.error("Erreur de connexion à MongoDB :", erreur.message);
        process.exit(1);
    });