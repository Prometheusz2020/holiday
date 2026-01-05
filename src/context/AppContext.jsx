import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [employees, setEmployees] = useState([]);
    const [vacations, setVacations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: empData, error: empError } = await supabase.from('employees').select('*');
            if (empError) throw empError;

            const { data: vacData, error: vacError } = await supabase.from('vacations').select('*');
            if (vacError) throw vacError;

            setEmployees(empData || []);
            setVacations(vacData || []);

            // Seeding Logic: If empty, add the Pratali family
            if (empData && empData.length === 0) {
                console.log("Seeding Database...");
                const seedData = [
                    { name: 'Geovani Pratali', role: 'CEO', salary: 15000, hire_date: new Date().toISOString() },
                    { name: 'Ernani Pratali', role: 'CEO', salary: 15000, hire_date: new Date().toISOString() },
                    { name: 'Valdeci Pratali', role: 'CEO', salary: 15000, hire_date: new Date().toISOString() }
                ];

                const { data: seedResult, error: seedError } = await supabase.from('employees').insert(seedData).select();
                if (seedError) console.error("Error seeding:", seedError);
                else setEmployees(seedResult);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addEmployee = async (data) => {
        const { data: newEmp, error } = await supabase
            .from('employees')
            .insert([{
                name: data.name,
                role: data.role,
                salary: data.salary,
                hire_date: data.hireDate ? data.hireDate : null
            }])
            .select();

        if (error) {
            console.error("Error adding employee:", error);
            return;
        }
        setEmployees([...employees, ...newEmp]);
    };

    const updateEmployee = async (id, data) => {
        const { error } = await supabase
            .from('employees')
            .update({
                name: data.name,
                role: data.role,
                salary: data.salary,
                hire_date: data.hireDate ? data.hireDate : null
            })
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
        const { data: newVac, error } = await supabase
            .from('vacations')
            .insert([{
                employee_id: data.employeeId,
                start_date: data.startDate,
                end_date: data.endDate
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
            deleteVacation
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
