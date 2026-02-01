-- 1. Create Establishments Table
CREATE TABLE establishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    business_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Profiles Table (Linking Users to Establishments)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('CEO', 'Gerente', 'Funcionario')) DEFAULT 'Funcionario',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add establishment_id to existing tables
ALTER TABLE employees ADD COLUMN establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE;
ALTER TABLE vacations ADD COLUMN establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE;
ALTER TABLE time_logs ADD COLUMN establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Establishments: Users can view their own establishment
CREATE POLICY "Users can view own establishment" ON establishments
    FOR SELECT USING (id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

-- Employees: Users can view/edit employees of their establishment
CREATE POLICY "Tenant Isolation Select Employees" ON employees
    FOR SELECT USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Insert Employees" ON employees
    FOR INSERT WITH CHECK (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Update Employees" ON employees
    FOR UPDATE USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Delete Employees" ON employees
    FOR DELETE USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

-- Repeat similar Logic for Vacations and TimeLogs
CREATE POLICY "Tenant Isolation Select Vacations" ON vacations
    FOR SELECT USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Select TimeLogs" ON time_logs
    FOR SELECT USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Insert TimeLogs" ON time_logs
    FOR INSERT WITH CHECK (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

-- 6. Helper Function for Registration
-- This function allows creating an establishment and the first admin safely
CREATE OR REPLACE FUNCTION create_establishment_and_admin(
    p_name TEXT, 
    p_business_type TEXT, 
    p_admin_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_establishment_id UUID;
BEGIN
    -- Create Establishment
    INSERT INTO establishments (name, business_type)
    VALUES (p_name, p_business_type)
    RETURNING id INTO new_establishment_id;

    -- Create/Link Admin Profile
    INSERT INTO profiles (id, establishment_id, role)
    VALUES (p_admin_id, new_establishment_id, 'CEO');

    RETURN new_establishment_id;
END;
$$;

-- 7. SEED DATA (MIGRATION FOR SKINA BEER)
DO $$
DECLARE
    skina_id UUID;
BEGIN
    -- Check if Skina Beer exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM establishments WHERE name = 'Skina Beer') THEN
        INSERT INTO establishments (name, business_type) 
        VALUES ('Skina Beer', 'Gestão de Férias')
        RETURNING id INTO skina_id;

        -- Update existing data to belong to Skina Beer
        -- Note: correct logic would be to link users first. 
        -- Assuming current users (all of them) belong to Skina Beer for now.
        
        -- Link all current employees to Skina Beer
        UPDATE employees SET establishment_id = skina_id WHERE establishment_id IS NULL;
        UPDATE vacations SET establishment_id = skina_id WHERE establishment_id IS NULL;
        UPDATE time_logs SET establishment_id = skina_id WHERE establishment_id IS NULL;
        
        -- Note: We need to also create profiles for existing auth users. 
        -- Since we can't easily iterate auth.users in plain SQL without permissions, 
        -- this might need to be done manually or via a separate script if there are many users.
        -- For now, this script prepares the structure.
    END IF;
END
$$;


-- Master Dashboard Features
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS payment_warning BOOLEAN DEFAULT FALSE;

-- Master Dashboard Policy: Allow reading all establishments (Needed for Dashboard list)
-- Note: In production, you might want to restrict this to specific users, but for now Public Read allows the dashboard to fetch the list.
DROP POLICY IF EXISTS "Allow Public Read" ON establishments;
CREATE POLICY "Allow Public Read" ON establishments FOR SELECT USING (true);

-- RPC to update flags (Blocked/Warning) securely
CREATE OR REPLACE FUNCTION update_establishment_flags(
  p_id UUID,
  p_blocked BOOLEAN,
  p_warning BOOLEAN
) RETURNS VOID AS $$
BEGIN
  UPDATE establishments 
  SET is_blocked = p_blocked, payment_warning = p_warning
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. FIX: CREATE PROFILES FOR EXISTING USERS
-- This block automatically creates a profile for any user that doesn't have one, linking them to the first establishment found (usually Skina Beer).
DO $$
DECLARE
    default_est_id UUID;
BEGIN
    -- Get the ID of Skina Beer or the first available establishment
    SELECT id INTO default_est_id FROM establishments ORDER BY created_at ASC LIMIT 1;

    IF default_est_id IS NOT NULL THEN
        -- Insert profiles for users who don't have one
        INSERT INTO profiles (id, establishment_id, role)
        SELECT id, default_est_id, 'CEO'
        FROM auth.users
        WHERE id NOT IN (SELECT id FROM profiles);
    END IF;
END $$;


-- 9. Fix Administrators Table
CREATE TABLE IF NOT EXISTS administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT,
    password TEXT,
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE
);

-- Ensure column exists even if table already existed
ALTER TABLE administrators ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE;

-- Backfill existing admins to Skina Beer (if needed)
-- Backfill existing admins to Skina Beer (if needed)
UPDATE administrators 
SET establishment_id = (SELECT id FROM establishments WHERE name = 'Skina Beer' LIMIT 1) 
WHERE establishment_id IS NULL;


-- 10. Fix: Register Time Log RPC (With Establishment ID)
DROP FUNCTION IF EXISTS register_time_log(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION register_time_log(
    p_employee_id UUID,
    p_pin_code TEXT,
    p_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_emp_id UUID;
    v_est_id UUID;
    v_name TEXT;
    v_last_type TEXT;
BEGIN
    -- Verify PIN and get Establishment ID
    SELECT id, establishment_id, name INTO v_emp_id, v_est_id, v_name
    FROM employees
    WHERE id = p_employee_id AND pin_code = p_pin_code;

    IF v_emp_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'PIN incorreto.');
    END IF;

    -- Get last log type for this employee (scoped to this establishment)
    SELECT type INTO v_last_type
    FROM time_logs
    WHERE employee_id = v_emp_id AND establishment_id = v_est_id
    ORDER BY timestamp DESC
    LIMIT 1;

    -- Anti-double entry logic
    IF p_type = 'IN' THEN
        IF v_last_type = 'IN' THEN
            RETURN json_build_object('success', false, 'message', 'Você já registrou entrada! Registre a saída primeiro.');
        END IF;
    ELSIF p_type = 'OUT' THEN
        IF v_last_type = 'OUT' OR v_last_type IS NULL THEN
            RETURN json_build_object('success', false, 'message', 'Você não registrou entrada! Registre a entrada primeiro.');
        END IF;
    END IF;

    -- Insert Log with Establishment ID
    INSERT INTO time_logs (employee_id, type, timestamp, establishment_id)
    VALUES (p_employee_id, p_type, NOW(), v_est_id);

    RETURN json_build_object('success', true, 'message', 'Ponto registrado!');
END;
$$;

-- 11. FIX: Enable Realtime for time_logs and Kiosk Admin Verification
-- Verify Admin PIN securely (bypassing RLS)
CREATE OR REPLACE FUNCTION verify_admin_pin(
    p_pin_code TEXT,
    p_establishment_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM employees
        WHERE pin_code = p_pin_code
        AND establishment_id = p_establishment_id
        AND role IN ('CEO', 'Gerente')
    ) INTO v_exists;

    RETURN v_exists;
END;
$$;

-- Enable Realtime
-- NOTE: You may need to run this command separately in the SQL Editor if it fails here due to permission
-- alter publication supabase_realtime add table time_logs;
