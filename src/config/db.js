const { Pool, types } = require("pg");

// Colonnes DATE (OID 1082) renvoyées telles quelles ("2023-01-10") au lieu d'un objet Date décalé par le fuseau horaire
types.setTypeParser(1082, (valeur) => valeur);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = pool;

