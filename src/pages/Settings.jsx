import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Settings, Save, Clock, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [settings, setSettings] = useState({
        autoLunch: false,
        lunchMinutes: 60
    });

    useEffect(() => {
        if (session?.establishment) {
            setSettings({
                autoLunch: session.establishment.auto_lunch || false,
                lunchMinutes: session.establishment.lunch_minutes || 60
            });
        }
    }, [session]);

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const data = await api.put(`/establishments/${session.establishment.id}/settings`, {
                autoLunch: settings.autoLunch,
                lunchMinutes: parseInt(settings.lunchMinutes)
            });

            if (data) {
                // Update local session (simplistic for current session)
                session.establishment.auto_lunch = data.autoLunch;
                session.establishment.lunch_minutes = data.lunchMinutes;
                localStorage.setItem('holiday_session', JSON.stringify(session));

                setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao salvar as configurações.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-10">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 flex items-center gap-3">
                    <Settings size={36} className="text-zinc-400" />
                    Configurações
                </h2>
                <p className="text-zinc-400 mt-2 text-lg">Personalize o comportamento do sistema para seu estabelecimento.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Auto Lunch Settings */}
                <div className="card border-l-4 border-l-blue-500 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Desconto de Almoço</h3>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-black">Automação</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-white/5">
                            <div>
                                <p className="font-bold text-white">Desconto Automático</p>
                                <p className="text-xs text-zinc-500 max-w-[200px]">Ative para descontar o tempo de almoço automaticamente em cada saída registrada.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={settings.autoLunch}
                                    onChange={e => setSettings({...settings, autoLunch: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className={settings.autoLunch ? "opacity-100 animate-in slide-in-from-top-2" : "opacity-30 pointer-events-none"}>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Tempo a ser descontado (Minutos)</label>
                            <input 
                                type="number" 
                                className="input-field w-full text-lg font-mono font-bold"
                                value={settings.lunchMinutes}
                                onChange={e => setSettings({...settings, lunchMinutes: e.target.value})}
                                min="1"
                                max="180"
                            />
                            <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                                <Info size={12} />
                                Sugestão Padrão: 60 minutos (1 hora).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Helpful Info Section */}
                <div className="space-y-6">
                   <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                        <h4 className="font-bold text-blue-400 flex items-center gap-2 mb-2">
                            <Info size={20} />
                            Como funciona o Desconto Automático:
                        </h4>
                        <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                            <li>Quando ativado, o sistema subtrai o tempo configurado do total trabalhado no dia.</li>
                            <li>Isso evita que o funcionário precise bater o ponto na saída e entrada do almoço.</li>
                            <li>O desconto é aplicado sempre que houver pelo menos um registro de ponto no dia.</li>
                        </ul>
                   </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-12 flex items-center gap-4">
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-primary flex items-center gap-2 px-8 py-4 shadow-xl shadow-blue-500/20"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    <span className="text-lg">Salvar Configurações</span>
                </button>

                {message && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-left ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="font-bold text-sm">{message.text}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

const Loader2 = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
