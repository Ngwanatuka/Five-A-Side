import express from 'express';
import cors from 'cors';
import teamRoutes from './routes/teamRoutes';
import playerRoutes from './routes/playerRoutes';
import financeRoutes from './routes/financeRoutes';
import leagueRoutes from './routes/leagueRoutes';
import matchRoutes from './routes/matchRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/league', leagueRoutes);
app.use('/api/matches', matchRoutes);

export default app;
