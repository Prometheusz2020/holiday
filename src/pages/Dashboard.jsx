import { useApp } from '../context/AppContext';
import { format, isWithinInterval, parseISO, isFuture, addDays, compareAsc, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Palmtree, DollarSign, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export default function Dashboard() {
    const { employees, vacations, loading } = useApp();
    const today = new Date();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const awayToday = vacations.filter(vac => {
        if (!vac.start_date || !vac.end_date) return false;
        // Data from supabase is YYYY-MM-DD string, parseISO handles it
        try {
            const start = parseISO(vac.start_date);
            const end = parseISO(vac.end_date);
            return isWithinInterval(today, { start, end });
        } catch (e) { return false; }
    });

    const upcomingLimit = addDays(today, 60);
    const upcomingVacations = vacations
        .filter(vac => {
            if (!vac.start_date) return false;
            const start = parseISO(vac.start_date);
            return isFuture(start) && start <= upcomingLimit;
        })
        .sort((a, b) => compareAsc(parseISO(a.start_date), parseISO(b.start_date)));

    const projectedCost = upcomingVacations.reduce((total, vac) => {
        const emp = employees.find(e => e.id === vac.employee_id); // Supabase uses employee_id (snake_case)
        if (!emp) return total;

        const start = parseISO(vac.start_date);
        const end = parseISO(vac.end_date);
        const msPerDay = 1000 * 60 * 60 * 24;
        const days = Math.ceil((end - start) / msPerDay) + 1;

        const pay = (emp.salary / 30 * days) * 1.3333;
        return total + pay;
    }, 0);

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-10">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Painel Geral</h2>
                <p className="text-zinc-400 mt-2 text-lg">Visão geral da equipe e custos</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
                    <div className="text-xs font-medium text-zinc-500 mt-2">
                        {awayToday.length > 0 ? `${awayToday.length} ausentes hoje` : 'Equipe completa'}
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
                    <div className="text-xs font-medium text-zinc-500 mt-2">Próximos 60 dias</div>
                </div>

                <div className="card border-l-4 border-l-blue-500 hover:-translate-y-1 transition-transform cursor-default">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Custo Previsto</p>
                            <h3 className="text-2xl font-bold mt-1 text-white">R$ {projectedCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div className="text-xs font-medium text-zinc-500 mt-2">Pagamento de férias</div>
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
                                const emp = employees.find(e => e.id === vac.employee_id);
                                return (
                                    <div key={vac.id} className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors border border-white/5">
                                        <div className="w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center font-bold text-xl text-primary">
                                            {emp?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{emp?.name}</h4>
                                            <p className="text-sm text-zinc-400">Volta em {format(parseISO(vac.end_date), 'd MMM', { locale: ptBR })}</p>
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
                                const emp = employees.find(e => e.id === vac.employee_id);
                                return (
                                    <div key={vac.id} className="flex justify-between items-center p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors border-l-4 border-primary shadow-lg lg:hover:pl-6">
                                        <div>
                                            <h4 className="font-bold text-lg">{emp?.name}</h4>
                                            <p className="text-sm text-zinc-400">{format(parseISO(vac.start_date), 'd MMM', { locale: ptBR })} - {format(parseISO(vac.end_date), 'd MMM', { locale: ptBR })}</p>
                                        </div>
                                        <div className="text-xs font-bold uppercase tracking-wider bg-surface px-2 py-1 rounded text-zinc-300 border border-white/5">
                                            {emp?.role}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
