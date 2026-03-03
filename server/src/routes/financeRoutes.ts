import { Router } from 'express';
import { registerPlayerFinance, getAllFinances, processPublicPayment } from '../controllers/financeController';

const router = Router();

router.get('/', getAllFinances);
router.post('/register', registerPlayerFinance);
router.post('/public-payment', processPublicPayment);

export default router;
