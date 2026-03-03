import { Router } from 'express';
import { updateMatchScore, addPlayerToRoster, getMatches } from '../controllers/matchController';

const router = Router();

router.get('/', getMatches);
router.patch('/:id/score', updateMatchScore);
router.post('/:id/roster', addPlayerToRoster);

export default router;
