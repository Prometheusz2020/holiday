import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export function AppProvider({ children }) {
    const { session } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [vacations, setVacations] = useState([]);
    const [liveAttendants, setLiveAttendants] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async (silent = false) => {
        if (!session?.establishment?.id) return; // Wait for session

        if (!silent) setLoading(true);
        try {
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('establishment_id', session.establishment.id);

            if (empError) throw empError;

            const { data: vacData, error: vacError } = await supabase
                .from('vacations')
                .select('*')
                .eq('establishment_id', session.establishment.id);

            if (vacError) throw vacError;

            // Fetch recent logs (last 24h)
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            const { data: logsData, error: logsError } = await supabase
                .from('time_logs')
                .select('*')
                .eq('establishment_id', session.establishment.id)
                .gte('timestamp', yesterday.toISOString())
                .order('timestamp', { ascending: false });

            if (logsError) console.error("Error fetching logs:", logsError);

            setEmployees(empData || []);
            setVacations(vacData || []);

            // Process Live Attendance
            const statusMap = {};
            if (logsData) {
                logsData.forEach(log => {
                    if (!statusMap[log.employee_id]) {
                        statusMap[log.employee_id] = log;
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

        const channel = supabase
            .channel('time-sheet-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'time_logs',
                    filter: `establishment_id=eq.${session.establishment.id}`
                },
                (payload) => {
                    console.log("New time log received, refreshing data...", payload);
                    fetchData(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    const addEmployee = async (data) => {
        if (!session?.establishment?.id) return;

        const payload = {
            name: data.name,
            role: data.role,
            salary: data.salary,
            hire_date: data.hireDate ? data.hireDate : null,
            establishment_id: session.establishment.id
        };
        if (data.pinCode) payload.pin_code = data.pinCode;

        const { data: newEmp, error } = await supabase
            .from('employees')
            .insert([payload])
            .select();

        if (error) {
            console.error("Error adding employee:", error);
            return;
        }
        setEmployees([...employees, ...newEmp]);
    };

    const updateEmployee = async (id, data) => {
        const payload = {
            name: data.name,
            role: data.role,
            salary: data.salary,
            hire_date: data.hireDate ? data.hireDate : null
        };
        if (data.pinCode) payload.pin_code = data.pinCode;

        const { error } = await supabase
            .from('employees')
            .update(payload)
            .eq('id', id);

        if (error) {
            console.error("Error updating employee:", error);
            return false;
        }

        setEmployees(employees.map(emp =>
            emp.id === id ? { ...emp, ...data, hire_date: data.hireDate } : emp
        ));
        return true;
    };

    const deleteEmployee = async (id) => {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (!error) {
            setEmployees(employees.filter(emp => emp.id !== id));
            setVacations(vacations.filter(vac => vac.employee_id !== id));
        }
    };

    const addVacation = async (data) => {
        if (!session?.establishment?.id) return;

        const { data: newVac, error } = await supabase
            .from('vacations')
            .insert([{
                employee_id: data.employeeId,
                start_date: data.startDate,
                end_date: data.endDate,
                establishment_id: session.establishment.id
            }])
            .select();

        if (error) {
            console.error("Error adding vacation:", error);
            return;
        }
        setVacations([...vacations, ...newVac]);
    };

    const deleteVacation = async (id) => {
        const { error } = await supabase.from('vacations').delete().eq('id', id);
        if (!error) {
            setVacations(vacations.filter(vac => vac.id !== id));
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
            fetchData // Exposing fetchData to refresh on Ponto updates if needed, though they are separate apps essentially (or same app different routes)
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
