import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export function AppProvider({ children }) {
    const { session } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [vacations, setVacations] = useState([]);
    const [liveAttendants, setLiveAttendants] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async (silent = false) => {
        if (!session?.establishment?.id) return;

        if (!silent) setLoading(true);
        try {
            const empData = await api.get(`/employees/${session.establishment.id}`);
            const vacData = await api.get(`/vacations/${session.establishment.id}`);
            const logsData = await api.get(`/time-logs/${session.establishment.id}`);

            setEmployees(empData || []);
            setVacations(vacData || []);

            // Process Live Attendance
            const statusMap = {};
            if (logsData) {
                // Filter only last 24h logs for live attendance
                const yesterday = new Date();
                yesterday.setHours(yesterday.getHours() - 24);
                
                logsData
                    .filter(log => new Date(log.timestamp) > yesterday)
                    .forEach(log => {
                        if (!statusMap[log.employeeId]) {
                            statusMap[log.employeeId] = log;
                        }
                    });
            }

            const activeWorkers = Object.keys(statusMap)
                .filter(id => statusMap[id].type === 'IN')
                .map(id => statusMap[id]);
            setLiveAttendants(activeWorkers);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (!session?.establishment?.id) return;
        fetchData();

        // Polling for data updates periodically
        const interval = setInterval(() => fetchData(true), 30000); 
        return () => clearInterval(interval);
    }, [session]);

    const addEmployee = async (data) => {
        if (!session?.establishment?.id) return;
        try {
            const newEmp = await api.post('/employees', {
                ...data,
                establishment_id: session.establishment.id
            });
            setEmployees([...employees, newEmp]);
        } catch (err) {
            console.error(err);
        }
    };

    const updateEmployee = async (id, data) => {
        try {
            const updatedEmp = await api.put(`/employees/${id}`, data);
            setEmployees(employees.map(emp => emp.id === id ? updatedEmp : emp));
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const deleteEmployee = async (id) => {
        try {
            await api.delete(`/employees/${id}`);
            setEmployees(employees.filter(emp => emp.id !== id));
            setVacations(vacations.filter(vac => vac.employeeId !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const addVacation = async (data) => {
        if (!session?.establishment?.id) return;
        try {
            const newVac = await api.post('/vacations', {
                ...data,
                establishment_id: session.establishment.id
            });
            setVacations([...vacations, newVac]);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteVacation = async (id) => {
        try {
            await api.delete(`/vacations/${id}`);
            setVacations(vacations.filter(vac => vac.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AppContext.Provider value={{
            employees,
            vacations,
            loading,
            addEmployee,
            updateEmployee,
            deleteEmployee,
            addVacation,
            deleteVacation,
            liveAttendants,
            fetchData
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
