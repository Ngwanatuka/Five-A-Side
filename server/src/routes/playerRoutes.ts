import { Router } from 'express';
import { addPlayerToTeam } from '../controllers/playerController';

const router = Router();

router.post('/', addPlayerToTeam);

export default router;
