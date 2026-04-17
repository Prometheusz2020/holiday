import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useMasterController() {
    const [masters, setMasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const { session } = useAuth();

    const fetchMasters = useCallback(async () => {
        if (!session?.establishment?.id) return;

        try {
            setLoading(true);
            const data = await api.get(`/administrators/${session.establishment.id}`);
            setMasters(data || []);
        } catch (error) {
            console.error('Error fetching masters:', error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    const addMaster = async (masterData) => {
        if (!session?.establishment?.id) return false;
        try {
            const data = await api.post('/administrators', {
                ...masterData,
                establishment_id: session.establishment.id
            });
            setMasters([...masters, data]);
            return true;
        } catch (error) {
            console.error('Error adding master:', error);
            alert('Erro ao adicionar administrador: ' + error.message);
            return false;
        }
    };

    const updateMaster = async (id, masterData) => {
        try {
            const data = await api.put(`/administrators/${id}`, masterData);
            setMasters(masters.map(m => m.id === id ? data : m));
            return true;
        } catch (error) {
            console.error('Error updating master:', error);
            alert('Erro ao atualizar: ' + error.message);
            return false;
        }
    };

    const deleteMaster = async (id) => {
        try {
            await api.delete(`/administrators/${id}`);
            setMasters(masters.filter(m => m.id !== id));
            return true;
        } catch (error) {
            console.error("Error deleting master", error);
            alert("Erro ao remover: " + error.message);
            return false;
        }
    }

    useEffect(() => {
        if (session) {
            fetchMasters();
        }
    }, [session, fetchMasters]);

    return {
        masters,
        loading,
        addMaster,
        updateMaster,
        deleteMaster,
        refresh: fetchMasters
    };
}
