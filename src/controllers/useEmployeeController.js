import { useApp } from '../context/AppContext';

export function useEmployeeController() {
    const { employees, addEmployee, deleteEmployee, updateEmployee } = useApp();

    const createEmployee = (data) => {
        // Validation Logic could go here
        if (!data.name || !data.salary) return false;

        addEmployee({
            ...data,
            salary: parseFloat(data.salary)
        });
        return true;
    };

    const removeEmployee = (id) => {
        if (confirm('Tem certeza que deseja remover este funcionário?')) {
            deleteEmployee(id);
        }
    };

    const editEmployee = async (id, data) => {
        if (!data.name || !data.salary) return false;

        return await updateEmployee(id, {
            ...data,
            salary: parseFloat(data.salary)
        });
    };

    return {
        employees,
        createEmployee,
        removeEmployee,
        editEmployee
    };
}
