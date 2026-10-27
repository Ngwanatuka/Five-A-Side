import { Router } from 'express';
import { addPlayerToTeam, getPlayers, deletePlayer } from '../controllers/playerController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', getPlayers);
router.post('/', optionalAuth, addPlayerToTeam);
router.delete('/:id', optionalAuth, deletePlayer);

export default router;
