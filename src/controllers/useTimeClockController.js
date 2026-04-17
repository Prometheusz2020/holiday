import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
        try {
            const data = await api.get(`/employees/${session.establishment.id}`);
            if (data) setEmployees(data);
        } catch (err) {
            console.error(err);
        }
    };

    const registerTimeLog = async (employeeId, pin, type) => {
        setLoading(true);
        setMessage(null);

        try {
            const data = await api.post('/time-logs/register', {
                employeeId,
                pinCode: pin,
                type
            });

            if (data && data.success) {
                setMessage({ type: 'success', text: `Ponto (${type === 'IN' ? 'Entrada' : 'Saída'}) registrado com sucesso!` });
                return true;
            } else {
                setMessage({ type: 'error', text: data?.message || 'Erro ao registrar ponto.' });
                return false;
            }

        } catch (err) {
            console.error("Clock error:", err);
            setMessage({ type: 'error', text: err.message || 'Erro de conexão com o servidor.' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const verifyAdminAccess = async (pin) => {
        if (!session?.establishment?.id) return false;

        setLoading(true);
        try {
            const data = await api.post('/auth/verify-admin', {
                pinCode: pin,
                establishmentId: session.establishment.id
            });

            setLoading(false);

            if (data.isAdmin) {
                return true;
            } else {
                setMessage({ type: 'error', text: 'PIN não autorizado.' });
                return false;
            }
        } catch (err) {
            setLoading(false);
            console.error("Access error:", err);
            setMessage({ type: 'error', text: 'Erro de conexão.' });
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
