import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Loader2, ArrowLeft, Building2, User, Lock, Plus, ShieldAlert, Ban, CheckCircle } from 'lucide-react';
import { hashPassword } from '../utils/auth';

export default function MasterDashboard() {
    const navigate = useNavigate();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [masterKeyInput, setMasterKeyInput] = useState('');

    // Dashboard States
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [establishments, setEstablishments] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        estName: '',
        estType: 'Bar',
        adminName: '',
        email: '',
        password: 'mudar123'
    });

    // --- ACCESS CONTROL ---
    const handleUnlock = (e) => {
        e.preventDefault();
        const validKey = import.meta.env.VITE_MASTER_KEY;
        if (masterKeyInput === validKey) {
            setIsUnlocked(true);
            fetchEstablishments();
        } else {
            alert("Chave Mestra incorreta!");
        }
    };

    // --- DASHBOARD ACTIONS ---
    const fetchEstablishments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('establishments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching:", error);
        else setEstablishments(data || []);
        setLoading(false);
    };

    const toggleStatus = async (id, currentStatus, type) => {
        const est = establishments.find(e => e.id === id);
        if (!est) return;

        const newBlocked = type === 'block' ? !est.is_blocked : est.is_blocked;
        const newWarning = type === 'warning' ? !est.payment_warning : est.payment_warning;

        // Optimistic UI
        setEstablishments(prev => prev.map(e => e.id === id ? { ...e, is_blocked: newBlocked, payment_warning: newWarning } : e));

        const { error } = await supabase.rpc('update_establishment_flags', {
            p_id: id,
            p_blocked: newBlocked,
            p_warning: newWarning
        });

        if (error) {
            alert("Erro ao atualizar status: " + error.message);
            fetchEstablishments(); // Revert
        }
    };

    // --- CREATE FORM ACTIONS ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: { data: { full_name: formData.adminName } }
            });
            if (authError) throw authError;
            if (!authData.user) throw new Error("Erro ao criar usuário.");

            // 2. Create Establishment & Profile (RPC)
            const { data: newEstId, error: rpcError } = await supabase.rpc('create_establishment_and_admin', {
                p_name: formData.estName,
                p_business_type: formData.estType,
                p_admin_id: authData.user.id
            });
            if (rpcError) throw rpcError;

            // 3. Auto-Register in Administrators Table (Master Panel Access)
            const hashedPassword = await hashPassword(formData.password);
            const { error: adminError } = await supabase.from('administrators').insert([{
                name: formData.adminName,
                email: formData.email,
                password: hashedPassword,
                establishment_id: newEstId
            }]);
            if (adminError) console.error("Auto-Admin Error:", adminError);

            // 4. Auto-Register in Employees Table (Kiosk Access - PIN 1234)
            const { error: empError } = await supabase.from('employees').insert([{
                name: formData.adminName,
                role: 'CEO',
                salary: 0, // Default for owner
                pin_code: '1234',
                establishment_id: newEstId,
                hire_date: new Date().toISOString()
            }]);
            if (empError) console.error("Auto-Employee Error:", empError);

            alert("Estabelecimento criado com sucesso! O dono já pode acessar o painel e o quiosque (PIN 1234).");
            setFormData({ estName: '', estType: '', adminName: '', email: '', password: 'mudar123' }); // Cleared Type
            setView('list');
            fetchEstablishments();
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isUnlocked) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="card w-full max-w-sm border-primary/20 shadow-2xl animate-in zoom-in-95">
                    <div className="mb-6">
                        <Link to="/login" className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                            <ArrowLeft size={16} /> Voltar
                        </Link>
                    </div>
                    <div className="text-center mb-6">
                        <Lock size={40} className="mx-auto text-primary mb-4" />
                        <h1 className="text-xl font-bold text-white uppercase">Área Admin</h1>
                        <p className="text-zinc-500 text-xs mt-1">Gestão de SaaS</p>
                    </div>
                    <form onSubmit={handleUnlock}>
                        <input type="password" className="input-field w-full text-center tracking-[0.5em] font-bold text-xl uppercase mb-4" placeholder="CHAVE" value={masterKeyInput} onChange={e => setMasterKeyInput(e.target.value)} autoFocus />
                        <button type="submit" className="w-full btn-primary py-3">Entrar</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Briefcase className="text-primary" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-white tracking-tighter">
                                Gestor<span className="text-primary">360</span>
                            </h1>
                            <p className="text-zinc-500 text-sm">Painel Master</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {view === 'create' && (
                            <button onClick={() => setView('list')} className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors font-bold text-sm">
                                Cancelar
                            </button>
                        )}
                        {view === 'list' && (
                            <button onClick={() => setView('create')} className="btn-primary px-4 py-2 flex items-center gap-2">
                                <Plus size={18} /> Novo Cliente
                            </button>
                        )}
                    </div>
                </header>

                {view === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {establishments.map(est => (
                            <div key={est.id} className={`card border-l-4 ${est.is_blocked ? 'border-l-red-500 opacity-75' : est.payment_warning ? 'border-l-orange-500' : 'border-l-green-500'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{est.name}</h3>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Desde {new Date(est.created_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{est.business_type || 'N/A'}</span>
                                        {est.payment_warning && (
                                            <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">A PAGAR</span>
                                        )}
                                        {est.is_blocked && (
                                            <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">BLOQUEADO</span>
                                        )}
                                        {!est.payment_warning && !est.is_blocked && (
                                            <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">EM DIA</span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2 border-t border-white/5 mt-2">
                                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                                            <Ban size={16} className={est.is_blocked ? "text-red-500" : "text-zinc-600"} />
                                            Bloquear Acesso
                                        </div>
                                        <button
                                            onClick={() => toggleStatus(est.id, est.is_blocked, 'block')}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${est.is_blocked ? 'bg-red-500' : 'bg-zinc-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${est.is_blocked ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                                            <ShieldAlert size={16} className={est.payment_warning ? "text-orange-500" : "text-zinc-600"} />
                                            Aviso de Cobrança
                                        </div>
                                        <button
                                            onClick={() => toggleStatus(est.id, est.payment_warning, 'warning')}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${est.payment_warning ? 'bg-orange-500' : 'bg-zinc-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${est.payment_warning ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card max-w-lg mx-auto">
                        <h2 className="text-xl font-bold mb-6">Cadastrar Novo Cliente</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input name="estName" placeholder="Nome do Estabelecimento" value={formData.estName} onChange={handleChange} className="input-field w-full" required />
                            <input name="estType" placeholder="Ramo de Atividade (ex: Loja)" list="est-types" value={formData.estType} onChange={handleChange} className="input-field w-full" />
                            <datalist id="est-types"><option value="Bar" /><option value="Restaurante" /><option value="Varejo" /><option value="Serviços" /></datalist>
                            <input name="adminName" placeholder="Nome do Dono" value={formData.adminName} onChange={handleChange} className="input-field w-full" required />
                            <input name="email" type="email" placeholder="Email (Login)" value={formData.email} onChange={handleChange} className="input-field w-full" required />
                            <p className="text-zinc-500 text-sm">Senha padrão: <b>mudar123</b></p>
                            <button type="submit" disabled={loading} className="w-full btn-primary py-3 flex justify-center gap-2">{loading ? <Loader2 className="animate-spin" /> : 'Cadastrar'}</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
