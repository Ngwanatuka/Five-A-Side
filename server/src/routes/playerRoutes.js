"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playerController_1 = require("../controllers/playerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', playerController_1.getPlayers);
router.post('/', auth_1.optionalAuth, playerController_1.addPlayerToTeam);
router.post('/:id/captain', auth_1.optionalAuth, playerController_1.setPlayerAsCaptain);
router.delete('/:id', auth_1.optionalAuth, playerController_1.deletePlayer);
exports.default = router;
//# sourceMappingURL=playerRoutes.js.map