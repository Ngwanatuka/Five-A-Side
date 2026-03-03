import { Router } from 'express';
import { updateMatchScore, addPlayerToRoster, getMatches, createMatch } from '../controllers/matchController';
import { isAuthenticated, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getMatches);
router.post('/', isAuthenticated, authorizeRole([Role.ADMIN]), createMatch);
router.patch('/:id/score', isAuthenticated, authorizeRole([Role.ADMIN, Role.REFEREE]), updateMatchScore);
router.post('/:id/roster', isAuthenticated, authorizeRole([Role.ADMIN, Role.REFEREE]), addPlayerToRoster);

export default router;
