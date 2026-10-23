"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playerController_1 = require("../controllers/playerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', playerController_1.getPlayers);
router.post('/', auth_1.optionalAuth, playerController_1.addPlayerToTeam);
exports.default = router;
//# sourceMappingURL=playerRoutes.js.map