"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const financeController_1 = require("../controllers/financeController");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.get('/', auth_1.isAuthenticated, (0, auth_1.authorizeRole)([client_1.Role.ADMIN, client_1.Role.CASHIER]), financeController_1.getAllFinances);
router.post('/register', auth_1.isAuthenticated, (0, auth_1.authorizeRole)([client_1.Role.ADMIN, client_1.Role.CASHIER]), financeController_1.registerPlayerFinance);
router.post('/public-payment', auth_1.isAuthenticated, (0, auth_1.authorizeRole)([client_1.Role.ADMIN, client_1.Role.CASHIER]), financeController_1.processPublicPayment);
exports.default = router;
//# sourceMappingURL=financeRoutes.js.map