const router = require("express").Router();

const ServeurController = require("../controllers/serveurController");

router.get("/", ServeurController.getAll);
router.get("/:id", ServeurController.getById);
router.post("/", ServeurController.create);
router.put("/:id", ServeurController.update);
router.delete("/:id", ServeurController.delete);

module.exports = router;
