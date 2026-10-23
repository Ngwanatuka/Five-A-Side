import { Router } from 'express';
import { addPlayerToTeam, getPlayers } from '../controllers/playerController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', getPlayers);
router.post('/', optionalAuth, addPlayerToTeam);

export default router;
