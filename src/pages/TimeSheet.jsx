import { ChevronLeft, ChevronRight, FileBarChart, Filter, Loader2, Share2, Clock, CalendarDays, Plus, Trash2, Pencil, Printer } from 'lucide-react';
import { format, subMonths, addMonths, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTimeSheetController } from '../controllers/useTimeSheetController';
import { openWhatsApp } from '../utils/whatsapp';
import ReportModal from '../components/ReportModal';
import TimeLogModal from '../components/TimeLogModal';
import StatusModal from '../components/StatusModal';
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
        updateTimeLog,
        deleteTimeLog,
        dailyStatuses,
        updateDailyStatus
    } = useTimeSheetController();

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [selectedDayForAdd, setSelectedDayForAdd] = useState(null);
    const [forcedEmployeeId, setForcedEmployeeId] = useState(null);
    const [forcedType, setForcedType] = useState('IN');

    // Status Modal State
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedStatusDate, setSelectedStatusDate] = useState(null);

    const calculateHours = (dayLogs) => {
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

    // Generate Calendar Days for the selected month
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
    });

    const today = new Date(); // Get current date

    // Calculate Totals
    let monthlyMinutes = 0;
    
    // Sort reverse to show latest first and FILTER future dates
    const dailyData = daysInMonth
        .filter(date => isBefore(date, today) || isSameDay(date, today)) // Strict date filtering
        .sort((a, b) => b - a)
        .map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayLogs = groupedLogs[dateKey] || [];
            const dayStatus = dailyStatuses.find(s => s.date === dateKey);

            // Calculate daily total ONLY if filtered by employee
            const duration = selectedEmployeeId !== 'ALL' ? calculateHours(dayLogs) : { hours: 0, minutes: 0, totalMinutes: 0 };
            monthlyMinutes += duration.totalMinutes;

            return {
                date: date,
                logs: dayLogs,
                duration,
                status: dayStatus,
                hasActivity: dayLogs.length > 0 || !!dayStatus
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

        dailyData
            .filter(d => d.hasActivity) // Only share days with activity
            .forEach(({ date, logs, duration, status }) => {
            text += `🔹 *${format(date, 'dd/MM/yyyy')}*`;
            if (status) text += ` [${status.status}]`;
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
            const success = await deleteTimeLog(id);
            if (!success) {
                alert('Erro ao excluir registro due to a server error.');
            }
        }
    };

    const handleEdit = (log) => {
        setEditingLog(log);
        setSelectedDayForAdd(null);
        setForcedEmployeeId(null);
        setForcedType('IN');
        setShowAddModal(true);
    };

    const handleAddNew = () => {
        setEditingLog(null);
        setSelectedDayForAdd(null);
        setForcedEmployeeId(null);
        setForcedType('IN');
        setShowAddModal(true);
    };

    const handleAddForDay = (date, empId = null, type = 'IN') => {
        setEditingLog(null);
        setSelectedDayForAdd(date); 
        setForcedEmployeeId(empId);
        setForcedType(type);
        setShowAddModal(true);
    };

    const handleOpenStatusModal = (dateStr) => {
        if (selectedEmployeeId === 'ALL') return alert('Selecione um funcionário primeiro.');
        setSelectedStatusDate(dateStr);
        setShowStatusModal(true);
    };

    const handleStatusUpdate = async (date, status, description) => {
        const success = await updateDailyStatus(selectedEmployeeId, date, status, description);
        if (!success) {
            alert('Erro ao atualizar status. Tente novamente.');
            return false;
        }
        return true;
    };

    const handleStatusDelete = async (date) => {
        const success = await updateDailyStatus(selectedEmployeeId, date, 'REMOVE');
         if (!success) {
            alert('Erro ao remover status.');
            return false;
        }
        return true;
    };

    return (
        <div className="animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
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
                    {selectedEmployeeId !== 'ALL' && (
                        <button
                            onClick={() => window.open(`/timesheet/print?employeeId=${selectedEmployeeId}&date=${format(selectedDate, 'yyyy-MM-dd')}`, '_blank')}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Printer size={20} />
                            <span className="hidden md:inline">Imprimir Espelho</span>
                        </button>
                    )}
                    <button onClick={handleShare} className="btn-secondary flex items-center gap-2">
                        <Share2 size={20} />
                         <span className="hidden md:inline">Compartilhar</span>
                    </button>
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
            {selectedEmployeeId !== 'ALL' && !loading && (
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
                ) : (
                    dailyData.map(({ date, logs: dayLogs, duration, status }) => (
                        <div key={date.toISOString()} className={`card p-0 overflow-hidden border border-white/5 ${status?.status === 'FALTA' ? 'border-red-500/30' : ''} ${dayLogs.length === 0 && !status ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
                            {/* Day Header */}
                            <div className="bg-white/5 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-lg capitalize flex items-center gap-2">
                                        {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {selectedEmployeeId !== 'ALL' && (
                                        <>
                                            <button 
                                                onClick={() => handleAddForDay(date)}
                                                className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                                title="Adicionar Registro neste dia"
                                            >
                                                <Plus size={16} />
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleOpenStatusModal(format(date, 'yyyy-MM-dd'))}
                                                className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-2
                                                    ${status 
                                                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                                                        : 'border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-300'
                                                    }`}
                                            >
                                                {status ? (
                                                    <>
                                                        <span className={`w-2 h-2 rounded-full 
                                                            ${status.status === 'FOLGA' ? 'bg-blue-500' : ''}
                                                            ${status.status === 'ATESTADO' ? 'bg-purple-500' : ''}
                                                            ${status.status === 'FALTA' ? 'bg-red-500' : ''}
                                                        `} />
                                                        {status.status}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Definir Status</span>
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}

                                    {selectedEmployeeId !== 'ALL' && (
                                        <div className="flex items-center gap-2 text-sm font-medium bg-zinc-950 px-3 py-1 rounded-full border border-white/10">
                                            <span className="text-zinc-500">Total:</span>
                                            <div className="flex items-center gap-2">
                                                <span className={duration.totalMinutes > 0 ? "text-white" : "text-zinc-500"}>
                                                    {formatDuration(duration)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Logs List */}
                            <div className="divide-y divide-white/5">
                                {(() => {
                                    // Group logs by employee
                                    const groups = {};
                                    dayLogs.forEach(log => {
                                        const empId = log.employeeId || log.employee_id;
                                        if (!groups[empId]) {
                                            const employee = log.employee || log.employees || employees.find(e => e.id === empId);
                                            groups[empId] = { employee, logs: [] };
                                        }
                                        groups[empId].logs.push(log);
                                    });
                                    
                                    const sortedGroups = Object.values(groups).sort((a, b) => 
                                        (a.employee?.name || '').localeCompare(b.employee?.name || '')
                                    );

                                    if (sortedGroups.length === 0) {
                                        return (
                                            <div className="px-6 py-12 text-center">
                                                <p className="text-zinc-500 italic text-sm">Nenhum registro de ponto registrado para este dia.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="flex flex-col">
                                            {/* Column Headers (Desktop only) */}
                                            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/[0.02] border-b border-white/5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                                <div className="col-span-3">Funcionário</div>
                                                <div className="col-span-7">Relatório de Horários (Entrada / Saída)</div>
                                                <div className="col-span-2 text-right">Duração do Dia</div>
                                            </div>

                                            {/* Rows */}
                                            <div className="divide-y divide-white/5">
                                                {sortedGroups.map(({ employee, logs: empLogs }) => {
                                                    const empDuration = calculateHours(empLogs);
                                                    
                                                    // Pair logs
                                                    const sortedLogs = [...empLogs].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
                                                    const pairs = [];
                                                    let tempIn = null;
                                                    
                                                    sortedLogs.forEach(log => {
                                                        if (log.type === 'IN') {
                                                            if (tempIn) pairs.push({ in: tempIn, out: null });
                                                            tempIn = log;
                                                        } else {
                                                            pairs.push({ in: tempIn, out: log });
                                                            tempIn = null;
                                                        }
                                                    });
                                                    if (tempIn) pairs.push({ in: tempIn, out: null });

                                                    return (
                                                        <div key={employee?.id || Math.random()} className="group px-4 md:px-6 py-4 flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-white/[0.03] transition-all">
                                                            
                                                            {/* Employee Name (Badge Style) */}
                                                            <div className="col-span-3 flex items-center gap-2 mb-2 md:mb-0">
                                                                <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 text-sm md:text-base tracking-tight truncate max-w-full hover:bg-blue-500/20 transition-colors">
                                                                    {employee?.name || 'Funcionário'}
                                                                </span>
                                                            </div>

                                                            {/* Time Pairs */}
                                                            <div className="col-span-7 flex flex-wrap items-center gap-2 md:gap-4 overflow-x-visible">
                                                                {pairs.map((pair, idx) => (
                                                                    <div key={idx} className="flex items-center bg-zinc-950/60 rounded-xl border border-white/10 shadow-lg flex-shrink-0 relative">
                                                                        {/* Entrance */}
                                                                        <div className="flex items-center gap-2 group/time relative px-3 py-2 border-r border-white/5 hover:bg-white/5 transition-colors first:rounded-l-xl">
                                                                            <span className="text-[9px] font-black text-emerald-500/80 uppercase">E</span>
                                                                            <span className="font-mono font-bold text-zinc-100 text-sm md:text-base">{pair.in ? format(parseISO(pair.in.timestamp), 'HH:mm') : '--:--'}</span>
                                                                            
                                                                            {pair.in && (
                                                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/20 rounded-lg p-1 flex gap-1 opacity-0 group-hover/time:opacity-100 transition-all duration-200 z-[100] shadow-2xl scale-110">
                                                                                    <button onClick={() => handleEdit(pair.in)} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"><Pencil size={12} /></button>
                                                                                    <button onClick={() => handleDelete(pair.in.id)} className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Exit */}
                                                                        <div className="flex items-center gap-2 group/time relative px-3 py-2 hover:bg-white/5 transition-colors last:rounded-r-xl">
                                                                            <span className="text-[9px] font-black text-orange-500/80 uppercase">S</span>
                                                                            <span className="font-mono font-bold text-zinc-100 text-sm md:text-base">
                                                                                {pair.out ? (
                                                                                    format(parseISO(pair.out.timestamp), 'HH:mm')
                                                                                ) : pair.in ? (
                                                                                    <button 
                                                                                        onClick={() => handleAddForDay(date, employee?.id, 'OUT')}
                                                                                        className="text-[9px] animate-pulse text-blue-500 hover:text-blue-400 font-bold uppercase transition-colors"
                                                                                    >
                                                                                        Pendente
                                                                                    </button>
                                                                                ) : (
                                                                                    '--:--'
                                                                                )}
                                                                            </span>
                                                                            
                                                                            {pair.out && (
                                                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/20 rounded-lg p-1 flex gap-1 opacity-0 group-hover/time:opacity-100 transition-all duration-200 z-[100] shadow-2xl scale-110">
                                                                                    <button onClick={() => handleEdit(pair.out)} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"><Pencil size={12} /></button>
                                                                                    <button onClick={() => handleDelete(pair.out.id)} className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Total (Desktop only) */}
                                                            <div className="col-span-2 text-right hidden md:block">
                                                                <span className="px-3 py-1.5 rounded-md bg-zinc-950/50 border border-white/5 font-mono font-bold text-blue-400 text-sm shadow-inner group-hover:border-blue-500/20 transition-all">
                                                                    {formatDuration(empDuration)}
                                                                </span>
                                                            </div>

                                                            {/* Mobile Total */}
                                                            <div className="md:hidden flex items-center justify-between mt-3 text-[10px] text-zinc-500 bg-white/5 p-2 rounded">
                                                                <span className="font-bold uppercase tracking-widest">Duração Total</span>
                                                                <span className="font-mono font-bold text-blue-400">{formatDuration(empDuration)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            <TimeLogModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                employees={employees}
                onSave={addTimeLog}
                onUpdate={updateTimeLog}
                initialEmployeeId={forcedEmployeeId || selectedEmployeeId}
                editingLog={editingLog}
                initialDate={selectedDayForAdd}
                initialType={forcedType}
            />

            <StatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                date={selectedStatusDate}
                currentStatus={dailyStatuses.find(s => s.date === selectedStatusDate)}
                onSave={handleStatusUpdate}
                onDelete={handleStatusDelete}
            />
        </div>
    );
}
