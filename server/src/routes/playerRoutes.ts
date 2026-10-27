import { Router } from 'express';
import { addPlayerToTeam, getPlayers, deletePlayer, setPlayerAsCaptain } from '../controllers/playerController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', getPlayers);
router.post('/', optionalAuth, addPlayerToTeam);
router.post('/:id/captain', optionalAuth, setPlayerAsCaptain);
router.delete('/:id', optionalAuth, deletePlayer);

export default router;
