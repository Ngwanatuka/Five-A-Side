import { Router } from 'express';
import { getDerbyData, saveDerbyData, resetDerbyData, resetSingleMatch } from '../controllers/derbyController';
import { optionalAuth, isAuthenticated, authorizeRole } from '../middleware/auth';

const router = Router();

router.get('/', getDerbyData);
router.post('/', optionalAuth, saveDerbyData);
router.post('/reset', optionalAuth, resetDerbyData);
router.post('/reset-match/:matchId', optionalAuth, resetSingleMatch);

export default router;
