
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.administrator.findMany();
    console.log(JSON.stringify(admins, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
