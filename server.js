import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'Neon' }));

// Login Simples (Check Administrators)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await prisma.administrator.findFirst({
            where: { email },
            include: { establishment: true }
        });

        if (!admin || admin.password !== password) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const session = {
            user: { id: admin.id, email: admin.email },
            profile: { id: admin.id, role: 'CEO', establishmentId: admin.establishmentId },
            establishment: admin.establishment
        };

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- EMPLOYEES ---
app.get('/api/employees/:establishmentId', async (req, res) => {
    try {
        const { establishmentId } = req.params;
        const employees = await prisma.employee.findMany({
            where: { establishmentId }
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        const data = req.body;
        const employee = await prisma.employee.create({
            data: {
                name: data.name,
                role: data.role,
                pinCode: data.pin_code || '1234',
                establishmentId: data.establishment_id
            }
        });
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const employee = await prisma.employee.update({
            where: { id },
            data: {
                name: data.name,
                role: data.role,
                pinCode: data.pin_code
            }
        });
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.employee.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- VACATIONS ---
app.get('/api/vacations/:establishmentId', async (req, res) => {
    try {
        const { establishmentId } = req.params;
        const vacations = await prisma.vacation.findMany({
            where: { establishmentId },
            include: { employee: true }
        });
        res.json(vacations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/vacations', async (req, res) => {
    try {
        const data = req.body;
        const vacation = await prisma.vacation.create({
            data: {
                employeeId: data.employee_id,
                establishmentId: data.establishment_id,
                startDate: new Date(data.start_date),
                endDate: new Date(data.end_date),
                status: 'Pending'
            }
        });
        res.json(vacation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/vacations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.vacation.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- TIME LOGS ---
app.post('/api/time-logs/register', async (req, res) => {
    const { employeeId, pinCode, type } = req.body;
    try {
        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee || employee.pinCode !== pinCode) {
            return res.status(401).json({ success: false, message: 'PIN incorreto.' });
        }
        const lastLog = await prisma.timeLog.findFirst({
            where: { employeeId },
            orderBy: { timestamp: 'desc' }
        });
        if (type === 'IN' && lastLog?.type === 'IN') {
            return res.status(400).json({ success: false, message: 'Você já registrou entrada!' });
        }
        if (type === 'OUT' && (lastLog?.type === 'OUT' || !lastLog)) {
            return res.status(400).json({ success: false, message: 'Você não registrou entrada!' });
        }
        const log = await prisma.timeLog.create({
            data: { employeeId, establishmentId: employee.establishmentId, type }
        });
        res.json({ success: true, message: 'Ponto registrado!', data: log });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- TIME LOGS ---
app.get('/api/time-logs/:establishmentId', async (req, res) => {
    try {
        const { establishmentId } = req.params;
        const { start, end, employeeId } = req.query;

        const where = { establishmentId };
        
        if (start && end) {
            where.timestamp = {
                gte: new Date(start),
                lte: new Date(end)
            };
        }

        if (employeeId && employeeId !== 'ALL') {
            where.employeeId = employeeId;
        }

        const logs = await prisma.timeLog.findMany({
            where,
            include: { employee: true },
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/time-logs', async (req, res) => {
    try {
        const data = req.body;
        const log = await prisma.timeLog.create({
            data: {
                employeeId: data.employee_id,
                establishmentId: data.establishment_id,
                type: data.type,
                timestamp: new Date(data.timestamp),
                method: 'MANUAL'
            }
        });
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/time-logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const log = await prisma.timeLog.update({
            where: { id },
            data: {
                type: data.type,
                timestamp: new Date(data.timestamp)
            }
        });
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/time-logs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.timeLog.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- DAILY STATUSES ---
app.get('/api/daily-statuses/:establishmentId', async (req, res) => {
    try {
        const { establishmentId } = req.params;
        const { start, end, employeeId } = req.query;

        const where = { establishmentId };
        if (start && end) {
            where.date = {
                gte: new Date(start),
                lte: new Date(end)
            };
        }
        if (employeeId && employeeId !== 'ALL') {
            where.employeeId = employeeId;
        }

        const statuses = await prisma.dailyStatus.findMany({ where });
        res.json(statuses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/daily-statuses/upsert', async (req, res) => {
    const data = req.body;
    try {
        const existing = await prisma.dailyStatus.findFirst({
            where: {
                employeeId: data.employee_id,
                date: new Date(data.date)
            }
        });

        if (data.status === 'REMOVE') {
            if (existing) await prisma.dailyStatus.delete({ where: { id: existing.id } });
            return res.json({ success: true });
        }

        if (existing) {
            const updated = await prisma.dailyStatus.update({
                where: { id: existing.id },
                data: { status: data.status, description: data.description }
            });
            res.json(updated);
        } else {
            const created = await prisma.dailyStatus.create({
                data: {
                    employeeId: data.employee_id,
                    establishmentId: data.establishment_id,
                    date: new Date(data.date),
                    status: data.status,
                    description: data.description
                }
            });
            res.json(created);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ADMINISTRATORS ---
app.get('/api/administrators/:establishmentId', async (req, res) => {
    try {
        const { establishmentId } = req.params;
        const admins = await prisma.administrator.findMany({
            where: { establishmentId },
            orderBy: { name: 'asc' }
        });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/administrators', async (req, res) => {
    try {
        const data = req.body;
        const admin = await prisma.administrator.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                establishmentId: data.establishment_id
            }
        });
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/administrators/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const admin = await prisma.administrator.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                password: data.password
            }
        });
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/administrators/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.administrator.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify Admin PIN (Replacement for RPC)
app.post('/api/auth/verify-admin', async (req, res) => {
    const { pinCode, establishmentId } = req.body;
    try {
        const employee = await prisma.employee.findFirst({
            where: {
                pinCode,
                establishmentId,
                role: { in: ['CEO', 'Gerente'] }
            }
        });
        res.json({ isAdmin: !!employee });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Neon rodando na porta ${PORT}`);
});
