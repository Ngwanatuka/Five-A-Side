"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matchController_1 = require("../controllers/matchController");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.get('/', matchController_1.getMatches);
router.post('/', auth_1.isAuthenticated, (0, auth_1.authorizeRole)([client_1.Role.ADMIN]), matchController_1.createMatch);
router.patch('/:id/score', auth_1.isAuthenticated, (0, auth_1.authorizeRole)([client_1.Role.ADMIN, client_1.Role.REFEREE]), matchController_1.updateMatchScore);
router.post('/:id/roster', auth_1.isAuthenticated, (0, auth_1.authorizeRole)([client_1.Role.ADMIN, client_1.Role.REFEREE]), matchController_1.addPlayerToRoster);
exports.default = router;
//# sourceMappingURL=matchRoutes.js.map