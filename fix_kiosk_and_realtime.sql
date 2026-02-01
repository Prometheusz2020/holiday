-- Enable Realtime for time_logs
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table time_logs, employees, vacations;
commit;

-- Function to verify Admin PIN securely (bypassing RLS for the check)
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
