"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const prisma_1 = __importDefault(require("./prisma"));
const derbyController_1 = require("./controllers/derbyController");
const PORT = process.env.PORT || 5000;
async function bootstrap() {
    try {
        await prisma_1.default.season.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, name: '2025/26 Season', status: 'ACTIVE' }
        });
        await prisma_1.default.division.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, name: 'Division 1', tierLevel: 1 }
        });
        // Initialize Dench Derby Tournament and synchronize teams and squads to database
        await (0, derbyController_1.initDerbyTournament)();
        app_1.httpServer.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`Server is running with WebSockets on http://0.0.0.0:${PORT}`);
        });
    }
    catch (err) {
        console.error('Server startup failed because database initialization did not complete:', err);
        process.exitCode = 1;
        try {
            await prisma_1.default.$disconnect();
        }
        catch (disconnectError) {
            console.error('Failed to disconnect Prisma after startup failure:', disconnectError);
        }
    }
}
bootstrap();
//# sourceMappingURL=index.js.map