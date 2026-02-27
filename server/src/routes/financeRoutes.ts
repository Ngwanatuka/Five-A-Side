import { Router } from 'express';
import { registerPlayerFinance, addPlayerToRoster } from '../controllers/financeController';

const router = Router();

router.post('/register', registerPlayerFinance);
router.post('/roster', addPlayerToRoster);

export default router;
