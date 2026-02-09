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

-- 3. Nova Tabela de Status Diário (Folga, Atestado, Falta)
CREATE TABLE IF NOT EXISTS daily_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('FOLGA', 'ATESTADO', 'FALTA')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- RLS para Status Diário
ALTER TABLE daily_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation Select DailyStatuses" ON daily_statuses
    FOR SELECT USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Insert DailyStatuses" ON daily_statuses
    FOR INSERT WITH CHECK (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Update DailyStatuses" ON daily_statuses
    FOR UPDATE USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Isolation Delete DailyStatuses" ON daily_statuses
    FOR DELETE USING (establishment_id IN (SELECT establishment_id FROM profiles WHERE id = auth.uid()));

-- Adicionar nova tabela ao Realtime
alter publication supabase_realtime add table daily_statuses;
