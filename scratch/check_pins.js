
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const employees = await prisma.employee.findMany();
    console.log(JSON.stringify(employees.map(e => ({ name: e.name, pinCode: e.pinCode })), null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
