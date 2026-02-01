import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Calendar, Briefcase, LogOut, Lock, User, Menu, X, ShieldCheck, Clock, ClipboardList, Ban } from 'lucide-react';
import { useState } from 'react';
import ChangePasswordModal from './ChangePasswordModal';
import UserProfileModal from './UserProfileModal';

export default function Layout({ children }) {
    const { signOut, session } = useAuth();
    const location = useLocation();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const linkClass = (path) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
    ${isActive(path)
            ? 'bg-primary text-black font-bold shadow-lg scale-105'
            : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
  `;

    const SidebarContent = () => (
        <>
            <div className="p-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                    <Briefcase className="text-black fill-black" size={24} />
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight uppercase line-clamp-1" title={session?.establishment?.name}>
                        {session?.establishment?.name || 'Carregando...'}
                    </h1>
                    <p className="text-[10px] text-zinc-500 tracking-wider uppercase">
                        {session?.establishment?.business_type || 'Estabelecimento'}
                    </p>
                </div>
            </div>

            {/* User Info */}
            <div className="mx-4 mb-2 p-3 rounded-lg bg-zinc-900/50 border border-white/5 flex items-center gap-3 animate-in hover:bg-zinc-800 transition-colors cursor-pointer" onClick={() => setShowProfileModal(true)}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-black font-bold text-xs uppercase shadow-sm">
                    {session?.user?.user_metadata?.full_name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">
                        Olá, {session?.user?.user_metadata?.full_name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'Visitante'}
                    </p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 flex flex-col gap-2">
                <Link to="/" className={linkClass('/')} onClick={() => setIsSidebarOpen(false)}>
                    <LayoutDashboard size={20} />
                    <span>Painel</span>
                </Link>
                <Link to="/employees" className={linkClass('/employees')} onClick={() => setIsSidebarOpen(false)}>
                    <Users size={20} />
                    <span>Equipe</span>
                </Link>
                <Link to="/calendar" className={linkClass('/calendar')} onClick={() => setIsSidebarOpen(false)}>
                    <Calendar size={20} />
                    <span>Férias</span>
                </Link>
                <Link to="/timesheet" className={linkClass('/timesheet')} onClick={() => setIsSidebarOpen(false)}>
                    <ClipboardList size={20} />
                    <span>Frequência</span>
                </Link>
                <Link to="/masters" className={linkClass('/masters')} onClick={() => setIsSidebarOpen(false)}>
                    <ShieldCheck size={20} />
                    <span>Admins</span>
                </Link>

                <div className="h-px bg-white/5 my-2"></div>

                <Link to="/ponto" className={linkClass('/ponto')} onClick={() => setIsSidebarOpen(false)} target="_blank">
                    <Clock size={20} />
                    <span>Abrir Quiosque</span>
                </Link>
            </nav>

            <div className="p-4 border-t border-white/5 flex flex-col gap-2">
                <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl w-full transition-colors"
                >
                    <User size={20} />
                    <span>Meus Dados</span>
                </button>

                <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl w-full transition-colors"
                >
                    <Lock size={20} />
                    <span>Alterar Senha</span>
                </button>

                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl w-full transition-colors"
                >
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </div>

            <div className="p-4 text-xs text-center text-zinc-600 border-t border-white/5">
                v1.4.0 • {session?.establishment?.name || 'Gestor360'}
            </div>
        </>
    );

    return (
        <div className="flex h-screen md:h-screen bg-background text-white overflow-hidden font-sans supports-[height:100dvh]:h-[100dvh]">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-shrink-0 bg-surface border-r border-white/5 flex-col shadow-2xl z-20">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-white/5 flex items-center justify-between px-4 z-30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                        <Briefcase className="text-black fill-black" size={18} />
                    </div>
                    <span className="font-bold text-lg uppercase tracking-tight">
                        {session?.establishment?.name || 'Gestor360'}
                    </span>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <aside className="absolute top-16 bottom-0 left-0 w-64 bg-surface border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-200">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/50 via-background to-background mt-16 md:mt-0">
                {session?.establishment?.is_blocked ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in zoom-in-95">
                        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <Ban size={48} className="text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Acesso Temporariamente Bloqueado</h1>
                        <p className="text-zinc-400 max-w-md">
                            O acesso deste estabelecimento foi suspenso. Entre em contato com a administração do Gestor360 para regularizar a situação.
                        </p>
                    </div>
                ) : (
                    <>
                        {session?.establishment?.payment_warning && (
                            <div className="bg-orange-500 text-white font-bold text-sm py-2 px-4 text-center animate-pulse relative z-50">
                                ⚠️ Aviso de Pagamento: Sua mensalidade está em aberto. Regularize para evitar bloqueio.
                            </div>
                        )}
                        <div className="max-w-6xl mx-auto p-4 md:p-12">
                            {children}
                        </div>
                    </>
                )}
            </main>

            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
            {showProfileModal && <UserProfileModal onClose={() => setShowProfileModal(false)} />}
        </div>
    );
}
