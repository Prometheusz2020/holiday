import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useMasterController() {
    const [masters, setMasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const { session } = useAuth();

    const fetchMasters = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('administrators')
                .select('*')
                .order('name');

            if (error) throw error;
            setMasters(data || []);
        } catch (error) {
            console.error('Error fetching masters:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addMaster = async (masterData) => {
        try {
            const { data, error } = await supabase
                .from('administrators')
                .insert([{ ...masterData }])
                .select();

            if (error) throw error;
            setMasters([...masters, data[0]]);
            return true;
        } catch (error) {
            console.error('Error adding master:', error);
            alert('Erro ao adicionar administrador: ' + error.message);
            return false;
        }
    };

    const updateMaster = async (id, masterData) => {
        try {
            const { error } = await supabase
                .from('administrators')
                .update(masterData)
                .eq('id', id);

            if (error) throw error;

            setMasters(masters.map(m => m.id === id ? { ...m, ...masterData } : m));
            return true;
        } catch (error) {
            console.error('Error updating master:', error);
            alert('Erro ao atualizar: ' + error.message);
            return false;
        }
    };

    const deleteMaster = async (id) => {
        try {
            const { error } = await supabase.from('administrators').delete().eq('id', id);
            if (error) throw error;
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
