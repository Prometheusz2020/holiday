import { useState } from 'react';
import { useCalendarController } from '../controllers/useCalendarController';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calculator, X, Share2, FileBarChart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { openWhatsApp, formatCurrency } from '../utils/whatsapp';
import ReportModal from '../components/ReportModal';

export default function Calendar() {
    const { employees, vacations, calculateEstimation, scheduleVacation } = useCalendarController();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showGeneralReport, setShowGeneralReport] = useState(false); // New state for General Report

    const [formData, setFormData] = useState({
        employeeId: '',
        startDate: '',
        endDate: ''
    });

    const [costPreview, setCostPreview] = useState(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // ... (maintain existing handlers)

    const handleFormChange = (newPartialData) => {
        const newData = { ...formData, ...newPartialData };
        setFormData(newData);

        if (newData.employeeId && newData.startDate && newData.endDate) {
            setCostPreview(calculateEstimation(newData.employeeId, newData.startDate, newData.endDate));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (costPreview && costPreview.total > 0) {
            if (scheduleVacation(formData)) {
                setShowModal(false);
                setFormData({ employeeId: '', startDate: '', endDate: '' });
                setCostPreview(null);
            }
        }
    };

    const getVacationsForDay = (date) => {
        return vacations.filter(vac => {
            try {
                const start = parseISO(vac.start_date);
                const end = parseISO(vac.end_date);
                return isWithinInterval(date, { start, end });
            } catch { return false; }
        });
    };

    const monthlyVacations = vacations.filter(vac => {
        try {
            const start = parseISO(vac.start_date);
            const end = parseISO(vac.end_date);
            // Check if vacation overlaps with current month view
            return (start <= monthEnd && end >= monthStart);
        } catch { return false; }
    }).sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date));

    // Prepare data for the Monthly ReportModal
    const reportData = monthlyVacations.map(vac => {
        const emp = employees.find(e => e.id === vac.employee_id);
        const start = parseISO(vac.start_date);
        const end = parseISO(vac.end_date);

        // Calculate cost for this specific chunk? Or total cost?
        // For complexity simplicity, let's just show dates.
        // If needed, we can re-calculate estimated cost.

        const days = (end - start) / (1000 * 60 * 60 * 24) + 1;
        const payEstimate = (emp?.salary / 30 * days) * 1.3333;

        return {
            name: emp?.name || 'Desconhecido',
            role: emp?.role || '-',
            start,
            end,
            cost: payEstimate
        };
    });

    // Prepare data for General Report (All Vacations)
    const generalReportData = vacations
        .sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date))
        .map(vac => {
            const emp = employees.find(e => e.id === vac.employee_id);
            const start = parseISO(vac.start_date);
            const end = parseISO(vac.end_date);
            const days = (end - start) / (1000 * 60 * 60 * 24) + 1;

            return {
                name: emp?.name || 'Desconhecido',
                start,
                end,
                days,
                status: isWithinInterval(new Date(), { start, end }) ? 'Em andamento' : (start > new Date() ? 'Agendado' : 'Concluído')
            };
        });

    const generalReportColumns = [
        { header: 'Funcionário', accessor: 'name', className: 'font-bold text-white' },
        { header: 'Saída', cell: (row) => format(row.start, 'dd/MM/yy') },
        { header: 'Volta', cell: (row) => format(row.end, 'dd/MM/yy') },
        { header: 'Status', accessor: 'status', className: 'text-xs uppercase tracking-wider font-bold text-zinc-500' }
    ];

    const reportColumns = [
        { header: 'Funcionário', accessor: 'name', className: 'font-bold text-white' },
        { header: 'Saída', cell: (row) => format(row.start, 'dd/MM') },
        { header: 'Volta', cell: (row) => format(row.end, 'dd/MM') },
        { header: 'Previsão Pgt', cell: (row) => formatCurrency(row.cost), className: 'text-zinc-400' }
    ];

    const handleShareSchedule = () => {
        const monthName = format(currentDate, 'MMMM/yyyy', { locale: ptBR });
        const text = `📅 *Escala Mensal - Skina Beer*\n` +
            `🗓️ *Mês:* ${monthName}\n\n` +
            (monthlyVacations.length === 0 ? "Nenhuma férias." :
                monthlyVacations.map(v => {
                    const emp = employees.find(e => e.id === v.employee_id);
                    return `👤 ${emp?.name} (${format(parseISO(v.start_date), 'dd/MM')} a ${format(parseISO(v.end_date), 'dd/MM')})`;
                }).join('\n')) +
            `\n\n🔗 app.holidayskinabeer.com`;

        openWhatsApp(text);
    };

    const handleShareGeneral = () => {
        const text = `📅 *Relatório Geral de Férias - Skina Beer*\n\n` +
            generalReportData.map(v => `👤 ${v.name}: ${format(v.start, 'dd/MM/yy')} a ${format(v.end, 'dd/MM/yy')} (${v.status})`).join('\n') +
            `\n\n🔗 app.holidayskinabeer.com`;
        openWhatsApp(text);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Calendário de Férias</h2>
                    <p className="text-zinc-400 mt-2 text-lg">Agende e visualize os dias de folga</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-white/10 shadow-lg">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-white/5 rounded-md transition-colors"><ChevronLeft size={20} /></button>
                        <span className="font-bold min-w-[160px] text-center uppercase tracking-wider text-sm">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</span>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-white/5 rounded-md transition-colors"><ChevronRight size={20} /></button>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setShowReport(true)} className="btn-secondary flex items-center gap-2" title="Relatório Mês">
                            <FileBarChart size={20} />
                            <span className="hidden md:inline">Mês</span>
                        </button>
                        <button onClick={() => setShowGeneralReport(true)} className="btn-secondary flex items-center gap-2" title="Todas as Férias">
                            <FileBarChart size={20} />
                            <span className="hidden md:inline">Geral</span>
                        </button>
                    </div>

                    <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
                        <Plus size={20} />
                        <span>Agendar</span>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="rounded-xl border border-zinc-800 overflow-hidden shadow-2xl bg-zinc-900">
                <div className="grid grid-cols-7 bg-zinc-900 border-b border-zinc-800">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                        <div key={day} className="p-4 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-zinc-800">
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                        <div key={`pad-${i}`} className="bg-surface/50 min-h-[140px]"></div>
                    ))}

                    {daysInMonth.map(day => {
                        const dayVacations = getVacationsForDay(day);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div key={day.toString()} className={`bg-surface min-h-[140px] p-3 transition-colors hover:bg-zinc-800 group ${isToday ? 'bg-zinc-800/80' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-black' : 'text-zinc-400 group-hover:text-white'}`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    {dayVacations.map(vac => {
                                        const emp = employees.find(e => e.id === vac.employee_id);
                                        return (
                                            <div key={vac.id} className="text-xs font-medium bg-primary/10 text-primary px-2 py-1.5 rounded border border-primary/20 truncate shadow-sm transition-transform hover:scale-[1.02] cursor-default" title={emp?.name}>
                                                {emp?.name || 'Desconhecido'}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Pad end */}
                    {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
                        <div key={`pad-end-${i}`} className="bg-surface/50 min-h-[140px]"></div>
                    ))}
                </div>
            </div>

            {/* Report Modal - Monthly */}
            <ReportModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                title={`Escala: ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`}
                columns={reportColumns}
                data={reportData}
                onShare={handleShareSchedule}
            />

            {/* Report Modal - General */}
            <ReportModal
                isOpen={showGeneralReport}
                onClose={() => setShowGeneralReport(false)}
                title="Relatório Geral de Férias"
                columns={generalReportColumns}
                data={generalReportData}
                onShare={handleShareGeneral}
            />

            {/* Modal Overlay Schedule */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="card w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border-zinc-700">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-xl font-bold">Agendar Férias</h3>
                            <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-400">Funcionário</label>
                                <select
                                    className="input-field appearance-none cursor-pointer"
                                    value={formData.employeeId}
                                    onChange={e => handleFormChange({ employeeId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-400">Data Início</label>
                                    <input
                                        className="input-field cursor-pointer"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => handleFormChange({ startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-400">Data Fim</label>
                                    <input
                                        className="input-field cursor-pointer"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => handleFormChange({ endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {costPreview && (
                                <div className="bg-zinc-900/80 p-5 rounded-lg border border-primary/20 mt-2 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10 blur-xl"></div>

                                    <div className="flex items-center gap-2 text-primary mb-4 relative z-10">
                                        <Calculator size={18} />
                                        <span className="font-bold uppercase tracking-wider text-xs">Simulação Financeira</span>
                                    </div>

                                    <div className="space-y-2 text-sm relative z-10 text-zinc-300">
                                        <div className="flex justify-between">
                                            <span>Salário Proporcional ({costPreview.days} dias)</span>
                                            <span>R$ {costPreview.basePay.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>1/3 de Férias</span>
                                            <span>R$ {costPreview.bonus.toFixed(2)}</span>
                                        </div>
                                        <div className="h-px bg-white/10 my-2"></div>
                                        <div className="flex justify-between font-bold text-lg text-white">
                                            <span>Total Previsto</span>
                                            <span className="text-primary">R$ {costPreview.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Confirmar Agendamento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
