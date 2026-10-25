import { Router } from 'express';
import { getDerbyData, saveDerbyData, resetDerbyData } from '../controllers/derbyController';
import { optionalAuth, isAuthenticated, authorizeRole } from '../middleware/auth';

const router = Router();

router.get('/', getDerbyData);
router.post('/', optionalAuth, saveDerbyData);
router.post('/reset', isAuthenticated, authorizeRole(['ADMIN']), resetDerbyData);

export default router;
