import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding default season and division...');

    const season = await prisma.season.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: '2025/26 Season',
            status: 'ACTIVE',
        },
    });

    const division = await prisma.division.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Division 1',
            tierLevel: 1,
        },
    });

    console.log(`Created Season: ${season.name}`);
    console.log(`Created Division: ${division.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
