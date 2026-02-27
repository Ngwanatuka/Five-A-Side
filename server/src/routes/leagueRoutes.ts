import { Router } from 'express';
import { getStandings } from '../controllers/leagueController';

const router = Router();

router.get('/standings', getStandings);

export default router;
