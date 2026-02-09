import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export function useTimeSheetController() {
    const { session } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [dailyStatuses, setDailyStatuses] = useState([]);

    useEffect(() => {
        if (session?.establishment?.id) {
            fetchEmployees();
        }
    }, [session]);

    useEffect(() => {
        if (session?.establishment?.id) {
            fetchLogs();
        }
    }, [selectedDate, selectedEmployeeId, session]);

    const fetchEmployees = async () => {
        const { data } = await supabase
            .from('employees')
            .select('id, name')
            .eq('establishment_id', session.establishment.id)
            .order('name');
        if (data) setEmployees(data);
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(selectedDate).toISOString();
            const end = endOfMonth(selectedDate).toISOString();

            let query = supabase
                .from('time_logs')
                .select(`
                    id,
                    timestamp,
                    type,
                    employee_id,
                    employees (name)
                `)
                .eq('establishment_id', session.establishment.id)
                .gte('timestamp', start)
                .lte('timestamp', end)
                .order('timestamp', { ascending: false });

            if (selectedEmployeeId !== 'ALL') {
                query = query.eq('employee_id', selectedEmployeeId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);

            // Fetch Daily Statuses
            let statusQuery = supabase
                .from('daily_statuses')
                .select('*')
                .eq('establishment_id', session.establishment.id)
                .gte('date', start) // Assuming date is stored as YYYY-MM-DD, string comparison works for ISO, but better be careful
                .lte('date', end);

            if (selectedEmployeeId !== 'ALL') {
                statusQuery = statusQuery.eq('employee_id', selectedEmployeeId);
            }

            const { data: statusData, error: statusError } = await statusQuery;
            if (statusError) throw statusError;
            setDailyStatuses(statusData || []);

        } catch (err) {
            console.error("Error fetching timesheet:", err);
        } finally {
            setLoading(false);
        }
    };

    // Add logic for Manual Adjustments (addTimeLog, deleteTimeLog)
    const addTimeLog = async (formData) => {
        if (!session?.establishment?.id) return false;

        const { employeeId, type, date, time } = formData;

        // Combine date and time
        const timestamp = new Date(`${date}T${time}`).toISOString();

        const { data, error } = await supabase.from('time_logs').insert([{
            employee_id: employeeId,
            type,
            timestamp,
            establishment_id: session.establishment.id
        }]);

        if (error) {
            console.error("Error adding log:", error);
            return false;
        }
        fetchLogs(); // Refresh
        return true;
    };

    const updateTimeLog = async (id, data) => {
        if (!session?.establishment?.id) return false;

        const timestamp = new Date(`${data.date}T${data.time}`).toISOString();

        const { error } = await supabase
            .from('time_logs')
            .update({
                type: data.type,
                timestamp: timestamp
            })
            .eq('id', id)
            .eq('establishment_id', session.establishment.id);

        if (error) {
            console.error("Error updating log:", error);
            return false;
        }
        fetchLogs();
        return true;
    };

    const deleteTimeLog = async (id) => {
        if (!session?.establishment?.id) return false;

        const { error } = await supabase
            .from('time_logs')
            .delete()
            .eq('id', id)
            .eq('establishment_id', session.establishment.id);

        if (error) {
            console.error("Error deleting log:", error);
            return false;
        }
        fetchLogs();
        return true;
    };

    const updateDailyStatus = async (employeeId, date, status, description = '') => {
        if (!session?.establishment?.id) return false;

        // Check if exists
        const { data: existing } = await supabase
            .from('daily_statuses')
            .select('id')
            .eq('employee_id', employeeId)
            .eq('date', date)
            .single();

        let error;

        if (status === 'REMOVE') {
            if (existing) {
                const { error: delError } = await supabase
                    .from('daily_statuses')
                    .delete()
                    .eq('id', existing.id);
                error = delError;
            }
        } else {
            if (existing) {
                const { error: upError } = await supabase
                    .from('daily_statuses')
                    .update({ status, description })
                    .eq('id', existing.id);
                error = upError;
            } else {
                const { error: insError } = await supabase
                    .from('daily_statuses')
                    .insert([{
                        employee_id: employeeId,
                        date,
                        status,
                        description,
                        establishment_id: session.establishment.id
                    }]);
                error = insError;
            }
        }

        if (error) {
            console.error("Error updating daily status:", error);
            return false;
        }
        
        fetchLogs();
        return true;
    };

    return {
        logs,
        dailyStatuses,
        employees,
        loading,
        selectedDate,
        setSelectedDate,
        selectedEmployeeId,
        setSelectedEmployeeId,
        refreshLogs: fetchLogs,
        addTimeLog,
        updateTimeLog,
        deleteTimeLog,
        updateDailyStatus
    };
}
