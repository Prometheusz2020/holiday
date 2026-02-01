-- ==============================================================================
-- POR FAVOR, RODE ESTE COMANDO NO "SQL EDITOR" DO PAINEL DO SUPABASE
-- ==============================================================================

-- 1. Habilitar atualizações em tempo real (para o Dashboard funcionar sozinho)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table time_logs, employees, vacations;
commit;

-- 2. Criar função de segurança para verificar o PIN (corrige o erro ao sair do quiosque)
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
