"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const password = await bcryptjs_1.default.hash('password123', 10);
    const users = [
        { email: 'ngwanatuka@fivesway.xyz', role: client_1.Role.ADMIN },
        { email: 'referee@5aside.com', role: client_1.Role.REFEREE },
        { email: 'referee1@5aside.com', role: client_1.Role.REFEREE },
        { email: 'referee2@5aside.com', role: client_1.Role.REFEREE },
        { email: 'admin@5aside.com', role: client_1.Role.REFEREE },
        { email: 'cashier@5aside.com', role: client_1.Role.CASHIER },
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
//# sourceMappingURL=seed-users.js.map