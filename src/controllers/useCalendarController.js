import { useApp } from '../context/AppContext';
import { differenceInDays, parseISO } from 'date-fns';

export function useCalendarController() {
    const { employees, vacations, addVacation, deleteVacation } = useApp();

    const calculateEstimation = (empId, start, end) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp || !start || !end) return null;

        const startDate = parseISO(start);
        const endDate = parseISO(end);
        const days = differenceInDays(endDate, startDate) + 1;

        if (days <= 0) return null;

        const dailyRate = emp.salary / 30;
        const basePay = dailyRate * days;
        const bonus = basePay / 3;

        return {
            days,
            basePay,
            bonus,
            total: basePay + bonus
        };
    };

    const scheduleVacation = (data) => {
        // Business Logic: Check overlaps, check limits, etc.
        addVacation(data);
        return true;
    };

    return {
        employees,
        vacations,
        calculateEstimation,
        scheduleVacation,
        deleteVacation
    };
}
