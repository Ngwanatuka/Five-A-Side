"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const teamRoutes_1 = __importDefault(require("./routes/teamRoutes"));
const playerRoutes_1 = __importDefault(require("./routes/playerRoutes"));
const financeRoutes_1 = __importDefault(require("./routes/financeRoutes"));
const leagueRoutes_1 = __importDefault(require("./routes/leagueRoutes"));
const matchRoutes_1 = __importDefault(require("./routes/matchRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const derbyRoutes_1 = __importDefault(require("./routes/derbyRoutes"));
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
// Configure Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*', // In production, restrict this to your frontend URL
        methods: ['GET', 'POST', 'PATCH']
    }
});
exports.io = io;
// Broadcast connection for debugging
io.on('connection', (socket) => {
    console.log(`User connected to WebSocket: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
// Attach io to the app instance to be used inside controllers
app.set('io', io);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/teams', teamRoutes_1.default);
app.use('/api/players', playerRoutes_1.default);
app.use('/api/finances', financeRoutes_1.default);
app.use('/api/league', leagueRoutes_1.default);
app.use('/api/matches', matchRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/derby', derbyRoutes_1.default);
// Serve Vite client build in production
const clientDist = path_1.default.join(__dirname, '../../client/dist');
app.use(express_1.default.static(clientDist));
app.get('*path', (_req, res) => {
    res.sendFile(path_1.default.join(clientDist, 'index.html'));
});
exports.default = app;
//# sourceMappingURL=app.js.map