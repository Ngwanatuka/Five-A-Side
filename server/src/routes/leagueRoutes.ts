import { Router } from 'express';
import { getStandings, generateFixtures } from '../controllers/leagueController';

const router = Router();

router.get('/standings', getStandings);
router.post('/seasons/:seasonId/divisions/:divisionId/generate-fixtures', generateFixtures);

export default router;
