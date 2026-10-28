const router = require("express").Router();

const OffreController = require("../controllers/offreController");

router.get("/", OffreController.getAll);
router.get("/:id", OffreController.getById);
router.post("/", OffreController.create);
router.put("/:id", OffreController.update);
router.delete("/:id", OffreController.delete);

module.exports = router;
