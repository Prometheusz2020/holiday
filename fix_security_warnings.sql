-- ==========================================================
-- SCRIPT DE CORREÇÃO DE SEGURANÇA (SUPABASE)
-- Execute este script no SQL Editor do Supabase após o 
-- projeto estar "Active".
-- ==========================================================

-- 1. CORREÇÃO: "Function Search Path Mutable"
-- Define o search_path para as funções SECURITY DEFINER para evitar hijacking.

ALTER FUNCTION public.verify_admin_pin(p_pin_code TEXT, p_establishment_id UUID) 
SET search_path = public;

ALTER FUNCTION public.create_establishment_and_admin(p_name TEXT, p_business_type TEXT, p_admin_id UUID) 
SET search_path = public;

ALTER FUNCTION public.update_establishment_flags(p_id UUID, p_blocked BOOLEAN, p_warning BOOLEAN) 
SET search_path = public;

ALTER FUNCTION public.register_time_log(p_employee_id UUID, p_pin_code TEXT, p_type TEXT) 
SET search_path = public;


-- 2. CORREÇÃO: "RLS Policy Always True"
-- Remove políticas que usam USING(true) e as substitui por políticas baseadas em autenticação ou tenant.

-- Tabela: administrators
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Public Read" ON public.administrators;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.administrators;

CREATE POLICY "Admins can only see their own establishment" ON public.administrators
FOR SELECT TO authenticated USING (
    establishment_id IN (SELECT establishment_id FROM public.profiles WHERE id = auth.uid())
);

-- Tabela: establishments
DROP POLICY IF EXISTS "Allow Public Read" ON public.establishments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.establishments;

-- Permite que usuários logados vejam apenas o seu próprio estabelecimento
CREATE POLICY "Users can only see their own establishment" ON public.establishments
FOR SELECT TO authenticated USING (
    id IN (SELECT establishment_id FROM public.profiles WHERE id = auth.uid())
);

-- Tabela: employees
DROP POLICY IF EXISTS "Allow Public Read" ON public.employees;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.employees;
-- Nota: A política "Tenant Isolation Select Employees" já existe na migração original.

-- Tabela: time_logs
DROP POLICY IF EXISTS "Allow Public Read" ON public.time_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.time_logs;

-- Tabela: vacations
DROP POLICY IF EXISTS "Allow Public Read" ON public.vacations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vacations;

-- ==========================================================
-- FIM DO SCRIPT
-- ==========================================================
