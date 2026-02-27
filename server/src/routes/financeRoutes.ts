import { Router } from 'express';
import { registerPlayerFinance } from '../controllers/financeController';

const router = Router();

router.post('/register', registerPlayerFinance);

export default router;
