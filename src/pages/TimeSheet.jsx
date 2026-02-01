import { ChevronLeft, ChevronRight, FileBarChart, Filter, Loader2, Share2, Clock, CalendarDays, Plus, Trash2, Pencil } from 'lucide-react';
import { format, subMonths, addMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTimeSheetController } from '../controllers/useTimeSheetController';
import { openWhatsApp } from '../utils/whatsapp';
import ReportModal from '../components/ReportModal';
import TimeLogModal from '../components/TimeLogModal';
import { useState } from 'react';

export default function TimeSheet() {
    const {
        logs,
        employees,
        loading,
        selectedDate,
        setSelectedDate,
        selectedEmployeeId,
        setSelectedEmployeeId,
        addTimeLog,
        updateTimeLog, // Added
        deleteTimeLog
    } = useTimeSheetController();

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingLog, setEditingLog] = useState(null); // Added state

    // ... (helper functions calculateHours, formatDuration, groupedLogs, monthlyMinutes, dailyData, monthlyTotal, handleShare) ...

    const calculateHours = (dayLogs) => {
        let sorted = [...dayLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        // ... (rest of logic same as original file, just ensuring it's not deleted) ... 
        // Re-implementing simplified for replace context:
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
        return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60, totalMinutes };
    };

    const formatDuration = ({ hours, minutes }) => {
        if (hours === 0 && minutes === 0) return "-";
        return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    };

    // Group logs by day
    const groupedLogs = {};
    logs.forEach(log => {
        const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
        if (!groupedLogs[dateKey]) groupedLogs[dateKey] = [];
        groupedLogs[dateKey].push(log);
    });

    // Calculate Totals
    let monthlyMinutes = 0;
    const dailyData = Object.keys(groupedLogs).sort().reverse().map(dateKey => {
        const dayLogs = groupedLogs[dateKey];
        // Calculate daily total ONLY if filtered by employee (otherwise mixing people makes no sense for total)
        const duration = selectedEmployeeId !== 'ALL' ? calculateHours(dayLogs) : { hours: 0, minutes: 0, totalMinutes: 0 };
        monthlyMinutes += duration.totalMinutes;

        return {
            date: new Date(dateKey + 'T00:00:00'), // Ensure local date interpretation
            logs: dayLogs,
            duration
        };
    });

    const monthlyTotal = {
        hours: Math.floor(monthlyMinutes / 60),
        minutes: monthlyMinutes % 60
    };

    const handleShare = () => {
        const monthName = format(selectedDate, 'MMMM yyyy', { locale: ptBR });
        const empName = selectedEmployeeId === 'ALL' ? 'Todos' : employees.find(e => e.id === selectedEmployeeId)?.name;

        let text = `📅 *Relatório de Ponto - ${monthName}*\n`;
        text += `👤 *Funcionário:* ${empName}\n`;
        if (selectedEmployeeId !== 'ALL') {
            text += `⏱ *Total Mensal:* ${formatDuration(monthlyTotal)}\n`;
        }
        text += '\n';

        dailyData.forEach(({ date, logs, duration }) => {
            text += `🔹 *${format(date, 'dd/MM/yyyy')}*`;
            if (selectedEmployeeId !== 'ALL') text += ` (${formatDuration(duration)})`;
            text += '\n';

            logs.forEach(log => {
                const time = format(new Date(log.timestamp), 'HH:mm');
                const emoji = log.type === 'IN' ? '🟢' : '🔴';
                const name = log.employees?.name || 'Desconhecido';
                const nameStr = selectedEmployeeId === 'ALL' ? ` (${name})` : '';
                text += `   ${emoji} ${time} - ${log.type === 'IN' ? 'Entrada' : 'Saída'}${nameStr}\n`;
            });
            text += '\n';
        });

        text += `\nGerado pelo App Holiday Manager`;
        openWhatsApp(text);
    };

    const handleDelete = async (id) => {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            await deleteTimeLog(id);
        }
    };

    const handleEdit = (log) => {
        setEditingLog(log);
        setShowAddModal(true);
    };

    const handleAddNew = () => {
        setEditingLog(null);
        setShowAddModal(true);
    };

    // ... (handleDelete unchanged) ...

    return (
        <div className="animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                {/* ... (Header content unchanged) ... */}
                <div>
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Frequência
                    </h2>
                    <p className="text-zinc-400 mt-2 text-lg">Histórico de Entradas e Saídas</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        <span>Ajuste Manual</span>
                    </button>
                    {/* ... (Share button unchanged) ... */}
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-8 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-blue-500">
                {/* Date Filter */}
                <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-lg border border-white/5 shadow-inner">
                    <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="p-2 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
                        <CalendarDays size={18} className="text-blue-500" />
                        <span className="font-bold uppercase tracking-wider text-sm">
                            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                    </div>
                    <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="p-2 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Employee Filter */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Filter size={18} className="text-zinc-500" />
                    <select
                        className="input-field max-w-xs cursor-pointer"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    >
                        <option value="ALL">Todos os Funcionários</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Monthly Summary (Contextual) */}
            {selectedEmployeeId !== 'ALL' && !loading && logs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in slide-in-from-top duration-500">
                    <div className="card bg-zinc-900/50 border-zinc-800 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total em {format(selectedDate, 'MMMM', { locale: ptBR })}</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{formatDuration(monthlyTotal)}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="space-y-6">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                        <Clock size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Nenhum registro encontrado neste período.</p>
                    </div>
                ) : (
                    dailyData.map(({ date, logs: dayLogs, duration }) => (
                        <div key={date.toISOString()} className="card p-0 overflow-hidden border border-white/5">
                            {/* Day Header */}
                            <div className="bg-white/5 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-lg capitalize">
                                        {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                    </div>
                                </div>
                                {selectedEmployeeId !== 'ALL' && (
                                    <div className="flex items-center gap-2 text-sm font-medium bg-zinc-950 px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-zinc-500">Total:</span>
                                        <span className={duration.totalMinutes > 0 ? "text-white" : "text-zinc-500"}>
                                            {formatDuration(duration)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Logs List */}
                            <div className="divide-y divide-white/5">
                                {dayLogs.map(log => (
                                    <div key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${log.type === 'IN' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-orange-500'}`} />
                                            <div>
                                                <span className="font-mono text-xl font-bold tracking-tight">
                                                    {format(parseISO(log.timestamp), 'HH:mm')}
                                                </span>
                                                <span className="text-zinc-500 text-sm ml-2 font-medium">
                                                    {log.type === 'IN' ? 'Entrada' : 'Saída'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {selectedEmployeeId === 'ALL' && (
                                                <div className="text-sm text-zinc-400 font-medium hidden md:block">
                                                    {log.employees?.name}
                                                </div>
                                            )}

                                            {/* Edit Button */}
                                            <button
                                                onClick={() => handleEdit(log)}
                                                className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Editar Registro"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Excluir Registro"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            <TimeLogModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                employees={employees}
                onSave={addTimeLog}
                onUpdate={updateTimeLog}
                initialEmployeeId={selectedEmployeeId}
                editingLog={editingLog}
            />
        </div>
    );
}
