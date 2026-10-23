"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/login', authController_1.login);
router.post('/captain-login', authController_1.captainLogin);
router.get('/captains', authController_1.getCaptainsList);
router.get('/deadline', authController_1.getDeadline);
// Admin-only routes
router.get('/admin/captains', auth_1.isAuthenticated, (0, auth_1.authorizeRole)(['ADMIN']), authController_1.getAdminCaptainsList);
router.post('/admin/captains', auth_1.isAuthenticated, (0, auth_1.authorizeRole)(['ADMIN']), authController_1.updateCaptainByAdmin);
router.post('/admin/deadline', auth_1.isAuthenticated, (0, auth_1.authorizeRole)(['ADMIN']), authController_1.updateDeadlineByAdmin);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map