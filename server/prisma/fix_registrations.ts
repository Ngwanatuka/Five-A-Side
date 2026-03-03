import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixRegistrations() {
    console.log("Updating existing registrations...");
    const result = await prisma.teamSeasonRegistration.updateMany({
        where: {
            OR: [
                { status: 'PENDING' },
                { divisionId: null }
            ]
        },
        data: {
            status: 'APPROVED',
            divisionId: 1
        }
    });
    console.log(`Updated ${result.count} registrations.`);
}

fixRegistrations().catch(console.error).finally(() => prisma.$disconnect());
