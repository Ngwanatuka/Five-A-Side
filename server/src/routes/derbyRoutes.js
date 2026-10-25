"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const derbyController_1 = require("../controllers/derbyController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', derbyController_1.getDerbyData);
router.post('/', auth_1.optionalAuth, derbyController_1.saveDerbyData);
router.post('/reset', auth_1.optionalAuth, derbyController_1.resetDerbyData);
exports.default = router;
//# sourceMappingURL=derbyRoutes.js.map