import { Router } from 'express';
import { addPlayerToTeam, getPlayers } from '../controllers/playerController';

const router = Router();

router.get('/', getPlayers);
router.post('/', addPlayerToTeam);

export default router;
