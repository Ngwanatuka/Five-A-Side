import { Router } from 'express';
import { createTeam } from '../controllers/teamController';

const router = Router();

router.post('/', createTeam);

export default router;
