import { Router } from 'express';
import { updateMatchScore, addPlayerToRoster } from '../controllers/matchController';

const router = Router();

router.patch('/:id/score', updateMatchScore);
router.post('/:id/roster', addPlayerToRoster);

export default router;
