import { Router } from 'express';
import { createTeam, registerTeam, approveRegistration } from '../controllers/teamController';

const router = Router();

router.post('/', createTeam);
router.post('/register', registerTeam);
router.put('/registrations/:id/approve', approveRegistration);

export default router;
