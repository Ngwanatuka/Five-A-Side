import { Router } from 'express';
import { 
    login, 
    captainLogin, 
    getCaptainsList, 
    getDeadline, 
    getAdminCaptainsList, 
    updateCaptainByAdmin, 
    updateDeadlineByAdmin 
} from '../controllers/authController';
import { isAuthenticated, authorizeRole } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/captain-login', captainLogin);
router.get('/captains', getCaptainsList);
router.get('/deadline', getDeadline);

// Admin-only routes
router.get('/admin/captains', isAuthenticated, authorizeRole(['ADMIN']), getAdminCaptainsList);
router.post('/admin/captains', isAuthenticated, authorizeRole(['ADMIN']), updateCaptainByAdmin);
router.post('/admin/deadline', isAuthenticated, authorizeRole(['ADMIN']), updateDeadlineByAdmin);

export default router;
