import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    const users = [
        { email: 'ngwanatuka@fivesway.xyz', role: Role.ADMIN },
        { email: 'referee@5aside.com', role: Role.REFEREE },
        { email: 'referee1@5aside.com', role: Role.REFEREE },
        { email: 'referee2@5aside.com', role: Role.REFEREE },
        { email: 'admin@5aside.com', role: Role.REFEREE },
        { email: 'cashier@5aside.com', role: Role.CASHIER },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: { password, role: u.role },
            create: { email: u.email, password, role: u.role },
        });
    }

    const vuyoAdminPassword = process.env.VUYO_ADMIN_PASSWORD;
    if (vuyoAdminPassword) {
        const hashedPassword = await bcrypt.hash(vuyoAdminPassword, 10);
        await prisma.user.upsert({
            where: { email: 'vuyo@fivesway.xyz' },
            update: { password: hashedPassword, role: Role.ADMIN },
            create: { email: 'vuyo@fivesway.xyz', password: hashedPassword, role: Role.ADMIN },
        });
    }

    console.log('Default users seeded successfully!');
    console.log('Password for default users: password123');
    if (!vuyoAdminPassword) {
        console.log('Set VUYO_ADMIN_PASSWORD to seed vuyo@fivesway.xyz as an admin.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
