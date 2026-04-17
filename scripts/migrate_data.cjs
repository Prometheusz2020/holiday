const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Iniciando migração de dados do Supabase para o Neon...');

    try {
        // 1. Establishments
        console.log('--- Migrando Establishments ---');
        const { data: establishments, error: estError } = await supabase.from('establishments').select('*');
        if (estError) throw estError;
        
        for (const est of establishments) {
            await prisma.establishment.upsert({
                where: { id: est.id },
                update: {
                    name: est.name,
                    businessType: est.business_type,
                    isBlocked: est.is_blocked,
                    paymentWarning: est.payment_warning
                },
                create: {
                    id: est.id,
                    name: est.name,
                    businessType: est.business_type,
                    isBlocked: est.is_blocked,
                    paymentWarning: est.payment_warning,
                    createdAt: est.created_at
                }
            });
        }
        console.log(`✅ ${establishments.length} estabelecimentos migrados.`);

        // 2. Administrators
        console.log('--- Migrando Administrators ---');
        const { data: admins, error: adminError } = await supabase.from('administrators').select('*');
        if (adminError) throw adminError;

        for (const admin of admins) {
            await prisma.administrator.upsert({
                where: { id: admin.id },
                update: {
                    name: admin.name,
                    email: admin.email,
                    password: admin.password,
                    establishmentId: admin.establishment_id
                },
                create: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    password: admin.password,
                    establishmentId: admin.establishment_id
                }
            });
        }
        console.log(`✅ ${admins.length} administradores migrados.`);

        // 3. Employees
        console.log('--- Migrando Employees ---');
        const { data: employees, error: empError } = await supabase.from('employees').select('*');
        if (empError) throw empError;

        for (const emp of employees) {
            await prisma.employee.upsert({
                where: { id: emp.id },
                update: {
                    name: emp.name,
                    role: emp.role,
                    pinCode: emp.pin_code,
                    establishmentId: emp.establishment_id
                },
                create: {
                    id: emp.id,
                    name: emp.name,
                    role: emp.role,
                    pinCode: emp.pin_code,
                    establishmentId: emp.establishment_id,
                    createdAt: emp.created_at
                }
            });
        }
        console.log(`✅ ${employees.length} funcionários migrados.`);

        // 4. Time Logs
        console.log('--- Migrando Time Logs (Isso pode demorar...) ---');
        const { data: logs, error: logError } = await supabase.from('time_logs').select('*');
        if (logError) throw logError;

        for (const log of logs) {
            await prisma.timeLog.upsert({
                where: { id: log.id },
                update: {
                    type: log.type,
                    timestamp: log.timestamp,
                    establishmentId: log.establishment_id,
                    employeeId: log.employee_id
                },
                create: {
                    id: log.id,
                    type: log.type,
                    timestamp: log.timestamp,
                    establishmentId: log.establishment_id,
                    employeeId: log.employee_id,
                    createdAt: log.created_at
                }
            });
        }
        console.log(`✅ ${logs.length} registros de ponto migrados.`);

        // 5. Vacations
        console.log('--- Migrando Vacations ---');
        const { data: vacations, error: vacError } = await supabase.from('vacations').select('*');
        if (vacError) throw vacError;

        for (const vac of vacations) {
            await prisma.vacation.upsert({
                where: { id: vac.id },
                update: {
                    startDate: vac.start_date,
                    endDate: vac.end_date,
                    status: vac.status,
                    employeeId: vac.employee_id,
                    establishmentId: vac.establishment_id
                },
                create: {
                    id: vac.id,
                    startDate: vac.start_date,
                    endDate: vac.end_date,
                    status: vac.status,
                    employeeId: vac.employee_id,
                    establishmentId: vac.establishment_id,
                    createdAt: vac.created_at
                }
            });
        }
        console.log(`✅ ${vacations.length} registros de férias migrados.`);

        // 6. Profiles (Linking Neon users)
        console.log('--- Migrando Profiles ---');
        const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
        if (profError) throw profError;

        for (const prof of profiles) {
            await prisma.profile.upsert({
                where: { id: prof.id },
                update: {
                    establishmentId: prof.establishment_id,
                    role: prof.role
                },
                create: {
                    id: prof.id,
                    establishmentId: prof.establishment_id,
                    role: prof.role,
                    createdAt: prof.created_at
                }
            });
        }
        console.log(`✅ ${profiles.length} perfis migrados.`);

        console.log('\n✨ MIGRAÇÃO CONCLUÍDA COM SUCESSO! ✨');

    } catch (err) {
        console.error('\n❌ ERRO NA MIGRAÇÃO:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
