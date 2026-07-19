const express = require("express");
const internalController = require("../controllers/internal.controller");
const internalAuth = require("../middleware/internalAuth.middleware");

const router = express.Router();
router.use(internalAuth);

router.get("/overdue", internalController.getOverdueTasks);
router.patch("/:id/alert-sent", internalController.markAlertSent);

module.exports = router;
