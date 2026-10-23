"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teamController_1 = require("../controllers/teamController");
const router = (0, express_1.Router)();
router.get('/', teamController_1.getTeams);
router.post('/', teamController_1.createTeam);
router.post('/register', teamController_1.registerTeam);
router.put('/registrations/:id/approve', teamController_1.approveRegistration);
exports.default = router;
//# sourceMappingURL=teamRoutes.js.map