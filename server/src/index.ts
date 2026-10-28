import { httpServer } from './app';
import prisma from './prisma';
import { initDerbyTournament } from './controllers/derbyController';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
    try {
        await prisma.season.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, name: '2025/26 Season', status: 'ACTIVE' }
        });
        await prisma.division.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, name: 'Division 1', tierLevel: 1 }
        });

        // Initialize Dench Derby Tournament and synchronize teams and squads to database
        await initDerbyTournament();

        httpServer.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`Server is running with WebSockets on http://0.0.0.0:${PORT}`);
        });
    } catch (err) {
        console.error('Server startup failed because database initialization did not complete:', err);
        process.exitCode = 1;
        try {
            await prisma.$disconnect();
        } catch (disconnectError) {
            console.error('Failed to disconnect Prisma after startup failure:', disconnectError);
        }
    }
}

bootstrap();
