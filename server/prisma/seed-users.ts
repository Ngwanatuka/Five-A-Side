import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    const users = [
        { email: 'admin@5aside.com', role: Role.ADMIN },
        { email: 'referee@5aside.com', role: Role.REFEREE },
        { email: 'cashier@5aside.com', role: Role.CASHIER },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: { password, role: u.role },
            create: { email: u.email, password, role: u.role },
        });
    }

    console.log('Default users seeded successfully!');
    console.log('Password for all: password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
