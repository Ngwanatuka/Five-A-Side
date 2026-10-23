"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const season = await prisma.season.findFirst();
    const division = await prisma.division.findFirst();
    if (!season || !division) {
        console.error('Core data (Season/Division) not found. Run standard seed first.');
        return;
    }
    console.log('Clearing existing test data...');
    // Wipe test data to enforce idempotency and avoid double-booked matches on restart
    await prisma.matchRoster.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.playerSeasonFinance.deleteMany({});
    await prisma.player.deleteMany({});
    await prisma.teamSeasonRegistration.deleteMany({});
    await prisma.team.deleteMany({});
    // Create Teams
    const teamA = await prisma.team.create({
        data: { name: 'FC Barcelona', managerContact: 'barca@example.com' }
    });
    const teamB = await prisma.team.create({
        data: { name: 'Real Madrid', managerContact: 'madrid@example.com' }
    });
    // Register Teams
    await prisma.teamSeasonRegistration.create({
        data: { teamId: teamA.id, seasonId: season.id, divisionId: division.id, status: 'APPROVED' }
    });
    await prisma.teamSeasonRegistration.create({
        data: { teamId: teamB.id, seasonId: season.id, divisionId: division.id, status: 'APPROVED' }
    });
    // Create Players for Team A (10 players to test >9 limit)
    for (let i = 1; i <= 10; i++) {
        const player = await prisma.player.create({
            data: { teamId: teamA.id, firstName: `Player${i}`, lastName: 'Barca' }
        });
        // Set up finance. Half of them PAY_ON_DAY, some FULL, some HALF to test logic
        const tier = i % 3 === 0 ? client_1.PaymentTier.FULL : i % 3 === 1 ? client_1.PaymentTier.HALF : client_1.PaymentTier.PAY_ON_DAY;
        await prisma.playerSeasonFinance.create({
            data: {
                playerId: player.id,
                seasonId: season.id,
                paymentTier: tier,
                amountPaid: tier === client_1.PaymentTier.FULL ? 622 : tier === client_1.PaymentTier.HALF ? 311 : 0,
                gamesCredited: 0
            }
        });
    }
    // Create Players for Team B
    for (let i = 1; i <= 5; i++) {
        const player = await prisma.player.create({
            data: { teamId: teamB.id, firstName: `Player${i}`, lastName: 'Madrid' }
        });
        await prisma.playerSeasonFinance.create({
            data: {
                playerId: player.id,
                seasonId: season.id,
                paymentTier: client_1.PaymentTier.PAY_ON_DAY,
                amountPaid: 0,
                gamesCredited: 0
            }
        });
    }
    // Create Match
    const match = await prisma.match.create({
        data: {
            seasonId: season.id,
            divisionId: division.id,
            homeTeamId: teamA.id,
            awayTeamId: teamB.id,
            date: new Date(),
            time: '18:00',
            pitchNumber: 1,
            status: 'UPCOMING'
        }
    });
    console.log('Test data seeded successfully.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-test.js.map