const router = require("express").Router();

const ticketController = require("../controllers/ticketController");

router.post("/", ticketController.createTicket);
router.get("/:id", ticketController.getTicket);
router.post("/:id/messages", ticketController.addMessage);
router.patch("/:id/assign", ticketController.assignTicket);
router.patch("/:id/status", ticketController.updateStatutTicket);

module.exports = router;
