import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useTimeClockController } from '../controllers/useTimeClockController';
import { Clock, CheckCircle2, AlertCircle, LogIn, LogOut, Eraser, User, Lock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function Ponto() {
    const { session } = useAuth();
    const { employees, loading, message, registerTimeLog, verifyAdminAccess, setMessage } = useTimeClockController();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [actionType, setActionType] = useState(null); // IN, OUT, ADMIN
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [pin, setPin] = useState('');
    const navigate = useNavigate();

    // Clock Tick
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Handlers
    const handlePinClick = (digit) => {
        if (pin.length < 6) {
            setPin(prev => prev + digit);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleEmployeeSelect = (e) => {
        setSelectedEmployee(e.target.value);
    };

    const handleConfirm = async () => {
        if (actionType === 'ADMIN') {
            const allowed = await verifyAdminAccess(pin);
            if (allowed) {
                // Navigate to dashboard if admin
                window.location.href = '/';
            }
        } else {
            // Check In/Out
            if (!selectedEmployee) return;
            const success = await registerTimeLog(selectedEmployee, pin, actionType);
            if (success) {
                setTimeout(() => {
                    setActionType(null);
                    setPin('');
                    setSelectedEmployee('');
                    setMessage(null);
                }, 3000);
            } else {
                setPin(''); // Clear PIN on error
            }
        }
    };

    // 1. Home Screen (Select Action)
    if (!actionType) {
        return (
            <div className="min-h-[100dvh] bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Admin Button */}
                <button
                    onClick={() => setActionType('ADMIN')}
                    className="absolute top-6 right-6 p-3 text-zinc-600 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    title="Sair para Painel"
                >
                    <Lock size={20} />
                </button>

                <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
                    <p className="text-zinc-400 uppercase tracking-[0.2em] mb-2 font-medium">
                        {session?.establishment?.name || 'Gestor360'}
                    </p>
                    <h1 className="text-7xl md:text-9xl font-bold tracking-tighter tabular-nums bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                        {format(currentTime, 'HH:mm')}
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-500 mt-2 font-light">
                        {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4 animate-in slide-in-from-bottom duration-500 delay-200">
                    <button
                        onClick={() => setActionType('IN')}
                        className="group relative h-40 md:h-56 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-green-500/50 hover:bg-zinc-800/80 transition-all active:scale-95 flex flex-col items-center justify-center gap-4 shadow-2xl overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="p-4 bg-zinc-950 rounded-full border border-zinc-800 group-hover:border-green-500/50 group-hover:scale-110 transition-all duration-300">
                            <LogIn size={40} className="text-zinc-400 group-hover:text-green-500 transition-colors" />
                        </div>
                        <span className="text-2xl font-bold text-zinc-300 group-hover:text-white uppercase tracking-wider">Entrada</span>
                    </button>

                    <button
                        onClick={() => setActionType('OUT')}
                        className="group relative h-40 md:h-56 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/80 transition-all active:scale-95 flex flex-col items-center justify-center gap-4 shadow-2xl overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="p-4 bg-zinc-950 rounded-full border border-zinc-800 group-hover:border-orange-500/50 group-hover:scale-110 transition-all duration-300">
                            <LogOut size={40} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <span className="text-2xl font-bold text-zinc-300 group-hover:text-white uppercase tracking-wider">Saída</span>
                    </button>
                </div>

                {message && (
                    <div className={`fixed top-10 transform -translate-x-1/2 left-1/2 px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-50 animate-in slide-in-from-top fade-in ${message.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                        {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
                        <span className="font-bold">{message.text}</span>
                    </div>
                )}
            </div>
        );
    }

    // 2. PIN Pad Screen
    const getScreenTitle = () => {
        if (actionType === 'IN') return <span className="text-green-500">Registrar Entrada</span>;
        if (actionType === 'OUT') return <span className="text-orange-500">Registrar Saída</span>;
        return <span className="text-white">Acesso Administrativo</span>;
    };

    const getButtonColor = () => {
        if ((actionType !== 'ADMIN' && !selectedEmployee) || pin.length < 4) return 'bg-zinc-800 text-zinc-600 cursor-not-allowed';
        if (actionType === 'IN') return 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20';
        if (actionType === 'OUT') return 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20';
        return 'bg-white text-black hover:bg-zinc-200 shadow-white/20';
    };

    return (
        <div className="min-h-[100dvh] bg-zinc-950 text-white flex flex-col items-center justify-center p-4">

            <button
                onClick={() => { setActionType(null); setPin(''); setSelectedEmployee(''); setMessage(null); }}
                className="absolute top-6 left-6 text-zinc-500 hover:text-white uppercase text-sm tracking-wider font-bold flex items-center gap-2"
            >
                <ArrowLeft size={16} /> Voltar
            </button>

            <div className="w-full max-w-sm animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">
                        {getScreenTitle()}
                    </h2>
                    <p className="text-zinc-500">
                        {actionType === 'ADMIN' ? 'Digite o PIN de um Administrador' : 'Identifique-se para continuar'}
                    </p>
                </div>

                {/* Employee Select */}
                {actionType !== 'ADMIN' && (
                    <div className="mb-6 relative">
                        <User className="absolute left-4 top-3.5 text-zinc-500" size={20} />
                        <select
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-12 text-lg focus:outline-none focus:border-primary appearance-none cursor-pointer text-white"
                            value={selectedEmployee}
                            onChange={handleEmployeeSelect}
                        >
                            <option value="">Selecione seu nome...</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* PIN Display */}
                <div className="flex justify-center gap-4 mb-8 h-12">
                    {[0, 1, 2, 3].map(i => {
                        let activeColor = 'bg-zinc-500';
                        if (actionType === 'IN') activeColor = 'bg-green-500';
                        if (actionType === 'OUT') activeColor = 'bg-orange-500';
                        if (actionType === 'ADMIN') activeColor = 'bg-white';

                        return (
                            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? (activeColor + ' scale-110') : 'bg-zinc-800'}`}></div>
                        );
                    })}
                    {pin.length > 4 && <div className="w-4 h-4 rounded-full bg-zinc-800 opacity-50">+</div>}
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handlePinClick(num.toString())}
                            className="h-20 bg-zinc-900 rounded-2xl text-2xl font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white hover:scale-[1.02] active:scale-95 transition-all border border-zinc-800"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="flex items-center justify-center h-20"></div>
                    <button
                        onClick={() => handlePinClick('0')}
                        className="h-20 bg-zinc-900 rounded-2xl text-2xl font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white hover:scale-[1.02] active:scale-95 transition-all border border-zinc-800"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="h-20 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20"
                    >
                        <Eraser size={24} />
                    </button>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={(actionType !== 'ADMIN' && !selectedEmployee) || pin.length < 4 || loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider shadow-lg transition-all active:scale-95 ${getButtonColor()}`}
                >
                    {loading ? <span className="animate-pulse">Verificando...</span> : (actionType === 'ADMIN' ? 'Acessar Painel' : 'Confirmar')}
                </button>
            </div>

            {message && (
                <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-bottom ${message.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}
        </div>
    );
}
