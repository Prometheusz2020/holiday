import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, isWithinInterval, parseISO, isFuture, addDays, compareAsc } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Palmtree, Loader2, Share2, Wallet, FileBarChart, Clock, LogOut, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency, openWhatsApp } from '../utils/whatsapp';
import { useState } from 'react';
import ReportModal from '../components/ReportModal';

export default function Dashboard() {
    const { employees, vacations, loading, liveAttendants, fetchData } = useApp();
    const { session } = useAuth();
    const [showReport, setShowReport] = useState(false);
    const [showLiveReport, setShowLiveReport] = useState(false);
    const today = new Date();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }
    
    const awayToday = vacations.filter(vac => {
        if (!vac.startDate || !vac.endDate) return false;
        try {
            const start = parseISO(vac.startDate);
            const end = parseISO(vac.endDate);
            return isWithinInterval(today, { start, end });
        } catch (e) { return false; }
    });

    const upcomingLimit = addDays(today, 60);
    const upcomingVacations = vacations
        .filter(vac => {
            if (!vac.startDate) return false;
            const start = parseISO(vac.startDate);
            return isFuture(start) && start <= upcomingLimit;
        })
        .sort((a, b) => compareAsc(parseISO(a.startDate), parseISO(b.startDate)));

    const reportData = [...awayToday, ...upcomingVacations].map(vac => {
        const emp = employees.find(e => e.id === vac.employeeId);
        const start = parseISO(vac.startDate);
        const end = parseISO(vac.endDate);
        const days = (end - start) / (1000 * 60 * 60 * 24) + 1;
        const cost = (emp?.salary / 30 * days) * 1.3333;

        return {
            name: emp?.name || 'Desconhecido',
            start,
            end,
            days,
            cost: cost || 0
        };
    });

    const projectedCost = reportData.reduce((acc, curr) => acc + curr.cost, 0);

    const handleShareFinance = () => {
        const estName = session?.establishment?.name || 'Skina Beer';
        const text = `📊 *Resumo Financeiro - ${estName}*\n\n` +
            `💰 *Custo Previsto (Próx. 60 dias):* ${formatCurrency(projectedCost)}\n\n` +
            `*Detalhes:*\n` +
            reportData.map(d => `- ${d.name}: ${formatCurrency(d.cost)} (${d.days} dias)`).join('\n') +
            `\n\nGerado pelo App Holiday Manager`;

        openWhatsApp(text);
    };

    const reportColumns = [
        { header: 'Funcionário', accessor: 'name', className: 'font-bold text-white' },
        { header: 'Período', cell: (row) => `${format(row.start, 'dd/MM')} - ${format(row.end, 'dd/MM')}` },
        { header: 'Dias', accessor: 'days' },
        { header: 'Valor Est.', cell: (row) => formatCurrency(row.cost), className: 'text-green-400 font-medium' },
    ];

    const liveData = liveAttendants.map(log => {
        const emp = employees.find(e => e.id === log.employeeId);
        return {
            name: emp?.name || 'Desconhecido',
            role: emp?.role || '-',
            entry: parseISO(log.timestamp),
            employeeId: log.employeeId
        };
    });

    const handleShareLive = () => {
        const estName = session?.establishment?.name || 'Skina Beer';
        const text = `🕒 *Quem está trabalhando? - ${estName}*\n\n` +
            `👥 *Total:* ${liveData.length} pessoas\n\n` +
            `*Lista:*\n` +
            liveData.map(d => `- ${d.name} (${d.role})`).join('\n') +
            `\n\nGerado pelo App Holiday Manager`;
        openWhatsApp(text);
    };

    const handleForceLogout = async (employeeId) => {
        if (!confirm('Deseja dar saída manual para este funcionário agora?')) return;

        try {
            await api.post('/time-logs', {
                employee_id: employeeId,
                type: 'OUT',
                timestamp: new Date().toISOString(),
                establishment_id: session.establishment.id
            });
            fetchData(true);
        } catch (err) {
            console.error("Error logging out:", err);
            alert('Erro ao dar saída.');
        }
    };

    const liveColumns = [
        { header: 'Funcionário', accessor: 'name', className: 'font-bold text-white' },
        { header: 'Função', accessor: 'role', className: 'text-zinc-400 text-xs uppercase' },
        { header: 'Entrada', cell: (row) => format(row.entry, 'HH:mm'), className: 'text-green-400 font-mono' },
        {
            header: 'Ação',
            cell: (row) => (
                <button
                    onClick={() => handleForceLogout(row.employeeId)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    title="Dar Saída Manual"
                >
                    <LogOut size={14} />
                </button>
            ),
            className: 'w-10'
        }
    ];

    return (
        <div className="duration-500">
            <div className="mb-10">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Painel Geral</h2>
                <p className="text-zinc-400 mt-2 text-lg">Visão geral da equipe e custos</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
                <div className="card border-l-4 border-l-primary hover:-translate-y-1 transition-transform cursor-default">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Total Equipe</p>
                            <h3 className="text-3xl font-bold mt-1 text-white">{employees.length}</h3>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="card border-l-4 border-l-orange-500 hover:-translate-y-1 transition-transform cursor-default">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">De Férias Hoje</p>
                            <h3 className="text-3xl font-bold mt-1 text-white">{awayToday.length}</h3>
                        </div>
                        <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                            <Palmtree size={24} />
                        </div>
                    </div>
                </div>

                <div className="card border-l-4 border-l-emerald-500 hover:-translate-y-1 transition-transform cursor-default">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Próximas</p>
                            <h3 className="text-3xl font-bold mt-1 text-white">{upcomingVacations.length}</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <Calendar size={24} />
                        </div>
                    </div>
                </div>

                <div className="card border-l-4 border-l-blue-500 hover:-translate-y-1 transition-transform cursor-pointer group relative" onClick={() => setShowReport(true)}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Custo Previsto</p>
                            <h3 className="text-2xl font-bold mt-1 text-white">R$ {projectedCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <Wallet size={24} />
                        </div>
                    </div>
                </div>

                <div className="card border-l-4 border-l-green-500 hover:-translate-y-1 transition-transform cursor-pointer group relative" onClick={() => setShowLiveReport(true)}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Trabalhando Agora</p>
                            <h3 className="text-2xl font-bold mt-1 text-white">{liveAttendants.length} <span className="text-sm font-normal text-zinc-500">online</span></h3>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-500 animate-pulse">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Palmtree size={20} className="text-orange-500" />
                        Quem está de férias?
                    </h3>
                    {awayToday.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-zinc-700 rounded-lg bg-zinc-900/50">
                            <p className="text-zinc-500">Todo mundo trabalhando hoje!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {awayToday.map(vac => {
                                const emp = employees.find(e => e.id === vac.employeeId);
                                return (
                                    <div key={vac.id} className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors border border-white/5">
                                        <div className="w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center font-bold text-xl text-primary">
                                            {emp?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{emp?.name}</h4>
                                            <p className="text-sm text-zinc-400">Volta em {format(parseISO(vac.endDate), 'd MMM', { locale: ptBR })}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-emerald-500" />
                        Próximas Férias
                    </h3>
                    {upcomingVacations.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-zinc-700 rounded-lg bg-zinc-900/50">
                            <p className="text-zinc-500">Nenhuma férias agendada em breve.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingVacations.slice(0, 5).map(vac => {
                                const emp = employees.find(e => e.id === vac.employeeId);
                                return (
                                    <div key={vac.id} className="flex justify-between items-center p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors border-l-4 border-primary shadow-lg lg:hover:pl-6">
                                        <div>
                                            <h4 className="font-bold text-lg">{emp?.name}</h4>
                                            <p className="text-sm text-zinc-400">{format(parseISO(vac.startDate), 'd MMM', { locale: ptBR })} - {format(parseISO(vac.endDate), 'd MMM', { locale: ptBR })}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <ReportModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                title="Relatório Financeiro (60d)"
                columns={reportColumns}
                data={reportData}
                onShare={handleShareFinance}
                footer={
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Previsto</span>
                        <span className="text-primary">{formatCurrency(projectedCost)}</span>
                    </div>
                }
            />

            <ReportModal
                isOpen={showLiveReport}
                onClose={() => setShowLiveReport(false)}
                title="Quem está trabalhando?"
                columns={liveColumns}
                data={liveData}
                onShare={handleShareLive}
                footer={
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Online</span>
                        <span className="text-green-500">{liveAttendants.length}</span>
                    </div>
                }
            />
        </div>
    );
}
