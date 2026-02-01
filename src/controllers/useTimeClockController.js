import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export function useTimeClockController() {
    const { session } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (session?.establishment?.id) {
            fetchEmployees();
        }
    }, [session]);

    const fetchEmployees = async () => {
        const { data, error } = await supabase
            .from('employees')
            .select('id, name')
            .eq('establishment_id', session.establishment.id)
            .order('name');

        if (data) setEmployees(data);
    };

    const registerTimeLog = async (employeeId, pin, type) => {
        setLoading(true);
        setMessage(null);

        try {
            const { data, error } = await supabase.rpc('register_time_log', {
                p_employee_id: employeeId,
                p_pin_code: pin,
                p_type: type
            });

            if (error) throw error;

            if (data && data.success) {
                setMessage({ type: 'success', text: `Ponto (${type === 'IN' ? 'Entrada' : 'Saída'}) registrado com sucesso!` });
                return true;
            } else {
                setMessage({ type: 'error', text: data?.message || 'Erro ao registrar ponto.' });
                return false;
            }

        } catch (err) {
            console.error("Clock error:", err);
            setMessage({ type: 'error', text: 'Erro de conexão com o servidor.' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const verifyAdminAccess = async (pin) => {
        if (!session?.establishment?.id) return false;

        setLoading(true);
        try {
            // Check if PIN belongs to a CEO or Gerente OF THIS ESTABLISHMENT
            const { data, error } = await supabase
                .from('employees')
                .select('id')
                .eq('pin_code', pin)
                .eq('establishment_id', session.establishment.id)
                .in('role', ['CEO', 'Gerente'])
                .maybeSingle();

            setLoading(false);

            if (error) {
                console.error("verifyAdminAccess Error:", error);
                setMessage({ type: 'error', text: 'Erro ao verificar permissão.' });
                return false;
            }

            if (data) {
                return true;
            } else {
                setMessage({ type: 'error', text: 'PIN não autorizado.' });
                return false;
            }
        } catch (err) {
            setLoading(false);
            console.error("Access error:", err);
            setMessage({ type: 'error', text: 'Erro interno.' });
            return false;
        }
    };

    return {
        employees,
        loading,
        message,
        registerTimeLog,
        verifyAdminAccess,
        setMessage
    };
}
