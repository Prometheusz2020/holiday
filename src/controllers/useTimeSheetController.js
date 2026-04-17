import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { startOfMonth, endOfMonth } from 'date-fns';

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
        try {
            const data = await api.get(`/employees/${session.establishment.id}`);
            if (data) setEmployees(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(selectedDate).toISOString();
            const end = endOfMonth(selectedDate).toISOString();

            let query = `?start=${start}&end=${end}`;
            if (selectedEmployeeId !== 'ALL') {
                query += `&employeeId=${selectedEmployeeId}`;
            }

            const logsData = await api.get(`/time-logs/${session.establishment.id}${query}`);
            setLogs(logsData || []);

            const statusData = await api.get(`/daily-statuses/${session.establishment.id}${query}`);
            setDailyStatuses(statusData || []);

        } catch (err) {
            console.error("Error fetching timesheet:", err);
        } finally {
            setLoading(false);
        }
    };

    const addTimeLog = async (formData) => {
        if (!session?.establishment?.id) return false;
        const { employeeId, type, date, time } = formData;
        const timestamp = new Date(`${date}T${time}`).toISOString();

        try {
            await api.post('/time-logs', {
                employee_id: employeeId,
                type,
                timestamp,
                establishment_id: session.establishment.id
            });
            fetchLogs();
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const updateTimeLog = async (id, data) => {
        if (!session?.establishment?.id) return false;
        const timestamp = new Date(`${data.date}T${data.time}`).toISOString();

        try {
            await api.put(`/time-logs/${id}`, {
                type: data.type,
                timestamp: timestamp
            });
            fetchLogs();
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const deleteTimeLog = async (id) => {
        try {
            await api.delete(`/time-logs/${id}`);
            fetchLogs();
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const updateDailyStatus = async (employeeId, date, status, description = '') => {
        if (!session?.establishment?.id) return false;
        try {
            await api.post('/daily-statuses/upsert', {
                employee_id: employeeId,
                date,
                status,
                description,
                establishment_id: session.establishment.id
            });
            fetchLogs();
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
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
