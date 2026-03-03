import { Router } from 'express';
import { createTeam, registerTeam, approveRegistration, getTeams } from '../controllers/teamController';

const router = Router();

router.get('/', getTeams);
router.post('/', createTeam);
router.post('/register', registerTeam);
router.put('/registrations/:id/approve', approveRegistration);

export default router;
