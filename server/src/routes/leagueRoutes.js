"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leagueController_1 = require("../controllers/leagueController");
const router = (0, express_1.Router)();
router.get('/standings', leagueController_1.getStandings);
router.post('/seasons/:seasonId/divisions/:divisionId/generate-fixtures', leagueController_1.generateFixtures);
exports.default = router;
//# sourceMappingURL=leagueRoutes.js.map