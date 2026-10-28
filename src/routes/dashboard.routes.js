const router = require("express").Router();
const ctrl = require("../controllers/dashboardController");

router.get("/", ctrl.getDashboard);

module.exports = router;