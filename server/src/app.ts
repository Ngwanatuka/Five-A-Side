import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import teamRoutes from './routes/teamRoutes';
import playerRoutes from './routes/playerRoutes';
import financeRoutes from './routes/financeRoutes';
import leagueRoutes from './routes/leagueRoutes';
import matchRoutes from './routes/matchRoutes';

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: '*', // In production, restrict this to your frontend URL
        methods: ['GET', 'POST', 'PATCH']
    }
});

// Broadcast connection for debugging
io.on('connection', (socket) => {
    console.log(`User connected to WebSocket: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Attach io to the app instance to be used inside controllers
app.set('io', io);

app.use(cors());
app.use(express.json());

app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/league', leagueRoutes);
app.use('/api/matches', matchRoutes);

export { app, httpServer, io };
export default app;
