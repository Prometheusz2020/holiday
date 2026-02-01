
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try multiple paths
const pathsToTry = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../.env.local')
];

let envPath = null;
for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
        envPath = p;
        break;
    }
}

if (!envPath) {
    console.error("No .env file found!");
    process.exit(1);
}

console.log("Loading env from:", envPath);

const envConfig = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
    const firstEqual = line.indexOf('=');
    if (firstEqual === -1) return acc;
    const key = line.slice(0, firstEqual).trim();
    const val = line.slice(firstEqual + 1).trim();
    acc[key] = val;
    return acc;
}, {});

console.log("Keys found:", Object.keys(envConfig));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
// If Anon key fails Row Level Security (RLS), we might need the Service Key.
// Assuming VITE_SUPABASE_KEY is Anon.
// However, the RPC `create_establishment_and_admin` is SECURITY DEFINER potentially?
// Or we are inserting directly.
// The user has `VITE_MASTER_KEY` maybe I can use that? No.

// Let's try with the key we have.
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Checking for Skina Beer...");

    // Can't select from establishments directly if RLS blocks, but let's try RPC or minimal query.
    // If RLS allows read, great. If not, we blindly create?
    // Assume we need to create it.

    // 1. Create System User
    const email = `admin_${Date.now()}@skinabeer.com`;
    const password = 'skina_recovery_123';

    console.log(`Creating recovery admin: ${email}`);

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: 'Skina Admin' } }
    });

    if (authError || !authData.user) {
        console.error("Auth failed:", authError);
        return;
    }

    const userId = authData.user.id;
    console.log("User created:", userId);

    // 2. Call RPC
    console.log("Creating Establishment via RPC...");
    const { data: estId, error: rpcError } = await supabase.rpc('create_establishment_and_admin', {
        p_name: 'Skina Beer',
        p_business_type: 'Bar',
        p_admin_id: userId
    });

    if (rpcError) {
        console.error("RPC failed:", rpcError);
        return;
    }

    console.log("Establishment Created:", estId);

    // 3. Link Data
    // We can try to update even if RLS blocks (UPDATE might be restricted?)
    // If Update is restricted, we are stuck.
    // But usually RLS allows updating rows "where establishment_id is null" if the policy isn't strict?
    // Actually, RLS usually blocks EVERYTHING unless allowed.
    // However, for `employees`, users might need to be admin.
    // The user `userId` is now an admin of `estId` (via profiles -> establishment_id).
    // So if I sign in as `userId` in the supbase client, I can update rows that belong to my establishment?
    // But the orphans DON'T belong to me yet.
    // Chicken and egg.

    // OPTION: We assume the Anon Key has some privileges OR we output a SQL script for the user.
    // Let's try the UPDATE. If it fails, we fall back to generating SQL.

    // We need to sign in as the user to have RLS context?
    // No, `createClient` is Anon.
    // I can create a client WITH the user session?

    // Let's just output the SQL for the user to be safe.
    // The user has `supabase_migration.sql`.

    console.log("!!! MANUAL ACTION REQUIRED !!!");
    console.log("Please run the following SQL in Supabase SQL Editor to link your data:");
    console.log(`
    UPDATE employees SET establishment_id = '${estId}' WHERE establishment_id IS NULL;
    UPDATE time_logs SET establishment_id = '${estId}' WHERE establishment_id IS NULL;
    UPDATE administrators SET establishment_id = '${estId}' WHERE establishment_id IS NULL;
    INSERT INTO profiles (id, establishment_id, role)
    SELECT id, '${estId}', 'admin' FROM auth.users WHERE email IN ('ernani@example.com', 'val@example.com'); -- Replace with actual emails
    `);

    // Try to update anyway just in case Anon has open policy for NULLs (unlikely)
    const { error: empError, count } = await supabase
        .from('employees')
        .update({ establishment_id: estId })
        .is('establishment_id', null)
        .select('*', { count: 'exact' });

    if (empError) {
        console.log("Auto-link failed (expected due to RLS):", empError.message);
    } else {
        console.log(`Auto-linked ${count} employees.`);
    }

    console.log("Done. Skina Beer ID:", estId);
}

seed();
