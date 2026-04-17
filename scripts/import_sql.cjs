const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function importSql() {
    const dataDir = path.join(__dirname, '../data');
    const files = [
        'establishments_rows.sql',
        'employees_rows.sql',
        'administrators_rows.sql',
        'profiles_rows.sql',
        'time_logs_rows.sql',
        'daily_statuses_rows.sql'
    ];

    console.log('📥 Iniciando importação dos arquivos SQL para o Neon...');

    for (const fileName of files) {
        const filePath = path.join(dataDir, fileName);
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Arquivo ${fileName} não encontrado, pulando...`);
            continue;
        }

        console.log(`📑 Importando ${fileName}...`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
            // Executa o SQL bruto no banco
            await prisma.$executeRawUnsafe(sql);
            console.log(`✅ ${fileName} importado com sucesso.`);
        } catch (err) {
            console.error(`❌ Erro ao importar ${fileName}:`, err.message);
        }
    }

    console.log('\n✨ IMPORTAÇÃO FINALIZADA! ✨');
    await prisma.$disconnect();
}

importSql();
