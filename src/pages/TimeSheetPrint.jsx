import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Printer } from 'lucide-react';

export default function TimeSheetPrint() {
    const [searchParams] = useSearchParams();
    const { session } = useAuth();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [dailyStatuses, setDailyStatuses] = useState([]);
    const [employee, setEmployee] = useState(null);

    const employeeId = searchParams.get('employeeId');
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    const referenceDate = dateParam ? parseISO(dateParam) : new Date();

    useEffect(() => {
        if (session?.establishment?.id && employeeId) {
            fetchData();
        }
    }, [session, employeeId, dateParam]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Employee
            const employeesRaw = await api.get(`/employees/${session.establishment.id}`);
            const empData = employeesRaw.find(e => e.id === employeeId);
            setEmployee(empData);

            // 2. Fetch Logs
            const start = startOfMonth(referenceDate).toISOString();
            const end = endOfMonth(referenceDate).toISOString();

            const query = `?start=${start}&end=${end}&employeeId=${employeeId}`;
            const logData = await api.get(`/time-logs/${session.establishment.id}${query}`);
            setLogs(logData || []);

            // 3. Fetch Daily Statuses
            const statusData = await api.get(`/daily-statuses/${session.establishment.id}${query}`);
            setDailyStatuses(statusData || []);

        } catch (error) {
            console.error("Error fetching print data:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDailyTotal = (dayLogs) => {
        let sorted = [...dayLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        let totalMinutes = 0;
        let entryTime = null;

        sorted.forEach(log => {
            if (log.type === 'IN') {
                entryTime = new Date(log.timestamp);
            } else if (log.type === 'OUT' && entryTime) {
                totalMinutes += Math.floor((new Date(log.timestamp) - entryTime) / 60000);
                entryTime = null;
            }
        });

        return {
            hours: Math.floor(totalMinutes / 60),
            minutes: totalMinutes % 60,
            totalMinutes
        };
    };

    const formatDuration = ({ hours, minutes }) => {
        if (hours === 0 && minutes === 0) return "-";
        return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" size={32} /></div>;
    }

    if (!employee) {
        return <div className="p-8 text-center">Funcionário não encontrado.</div>;
    }

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate)
    });

    let monthlyMinutes = 0;

    return (
        <div className="bg-white text-black min-h-screen p-8 print:p-0 font-sans max-w-[210mm] mx-auto text-[12px]">
            <div className="print:hidden flex justify-end mb-8 sticky top-0 bg-white p-4 border-b shadow-sm">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Printer size={18} />
                    Imprimir Espelho
                </button>
            </div>

            <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">{session?.establishment?.name}</h1>
                        <p className="text-sm text-gray-500">Relatório de Espelho de Ponto</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold">{format(referenceDate, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Emitido em: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <span className="text-xs uppercase text-gray-500 font-bold block">Funcionário</span>
                    <span className="text-xl font-medium">{employee.name}</span>
                </div>
                <div>
                    <span className="text-xs uppercase text-gray-500 font-bold block">Função</span>
                    <span className="text-lg">{employee.role || '---'}</span>
                </div>
            </div>

            <div className="mb-8">
                <table className="w-full text-left text-sm border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100 uppercase">
                            <th className="border border-gray-300 p-2 w-28">Data</th>
                            <th className="border border-gray-300 p-2">Marcações de Ponto</th>
                            <th className="border border-gray-300 p-2 w-24 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {daysInMonth.map(date => {
                            const dateKey = format(date, 'yyyy-MM-dd');
                            const dayLogs = logs.filter(l => format(new Date(l.timestamp), 'yyyy-MM-dd') === dateKey);
                            const dayStatus = dailyStatuses.find(s => format(new Date(s.date), 'yyyy-MM-dd') === dateKey);
                            
                            const duration = calculateDailyTotal(dayLogs);
                            monthlyMinutes += duration.totalMinutes;

                            const markings = dayLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                                .map(l => format(new Date(l.timestamp), 'HH:mm'))
                                .join(' • ');

                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                            return (
                                <tr key={dateKey} className={isWeekend ? "bg-gray-50/50" : ""}>
                                    <td className="border border-gray-300 p-2 font-mono">
                                        {format(date, 'dd/MM')} <span className="text-gray-400 text-[10px] ml-1 uppercase">{format(date, 'EEE', { locale: ptBR })}</span>
                                    </td>
                                    {dayStatus ? (
                                        <td className="border border-gray-300 p-2 font-bold text-center bg-gray-50 text-gray-500 tracking-wider">
                                            {dayStatus.status} {dayStatus.description && `(${dayStatus.description})`}
                                        </td>
                                    ) : (
                                        <td className="border border-gray-300 p-2 font-mono">
                                            {markings || "-"}
                                        </td>
                                    )}
                                    <td className="border border-gray-300 p-2 text-right font-bold">
                                        {formatDuration(duration)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100 font-bold">
                            <td colSpan={2} className="border border-gray-300 p-2 text-right uppercase">Carga Horária Total Efetuada</td>
                            <td className="border border-gray-300 p-2 text-right text-base">
                                {Math.floor(monthlyMinutes / 60)}h {(monthlyMinutes % 60).toString().padStart(2, '0')}m
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-20 page-break-inside-avoid px-8">
                <div className="border-t-2 border-black pt-2 text-center">
                    <p className="font-bold text-sm">{session?.establishment?.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Carimbo e Assinatura da Empresa</p>
                </div>
                <div className="border-t-2 border-black pt-2 text-center">
                    <p className="font-bold text-sm">{employee.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Assinatura do Funcionário</p>
                </div>
            </div>

            <div className="mt-12 text-[9px] text-gray-400 text-center uppercase tracking-tighter">
                Espelho de Ponto • Holiday Manager Neon Server • Emitido via Cloud em {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
            </div>
        </div>
    );
}
