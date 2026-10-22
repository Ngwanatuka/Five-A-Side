import { Router } from 'express';
import { getDerbyData, saveDerbyData, resetDerbyData } from '../controllers/derbyController';

const router = Router();

router.get('/', getDerbyData);
router.post('/', saveDerbyData);
router.post('/reset', resetDerbyData);

export default router;
