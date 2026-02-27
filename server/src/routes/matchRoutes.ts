import { Router } from 'express';
import { updateMatchScore } from '../controllers/matchController';

const router = Router();

router.patch('/:id/score', updateMatchScore);

export default router;
