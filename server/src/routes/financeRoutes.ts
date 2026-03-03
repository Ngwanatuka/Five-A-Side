import { Router } from 'express';
import { registerPlayerFinance, getAllFinances, processPublicPayment } from '../controllers/financeController';
import { isAuthenticated, authorizeRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', isAuthenticated, authorizeRole([Role.ADMIN, Role.CASHIER]), getAllFinances);
router.post('/register', isAuthenticated, authorizeRole([Role.ADMIN, Role.CASHIER]), registerPlayerFinance);
router.post('/public-payment', isAuthenticated, authorizeRole([Role.ADMIN, Role.CASHIER]), processPublicPayment);

export default router;
