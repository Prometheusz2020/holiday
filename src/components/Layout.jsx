import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Calendar, Beer, LogOut, Lock, User } from 'lucide-react';
import { useState } from 'react';
import ChangePasswordModal from './ChangePasswordModal';
import UserProfileModal from './UserProfileModal';

export default function Layout({ children }) {
    const { signOut, session } = useAuth();
    const location = useLocation();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const isActive = (path) => location.pathname === path;

    const linkClass = (path) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
    ${isActive(path)
            ? 'bg-primary text-black font-bold shadow-lg scale-105'
            : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
  `;

    return (
        <div className="flex h-screen bg-background text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-surface border-r border-white/5 flex flex-col shadow-2xl z-20">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                        <Beer className="text-black fill-black" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight uppercase">Skina Beer</h1>
                        <p className="text-[10px] text-zinc-500 tracking-wider">RESTAURANTE</p>
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
                    <Link to="/" className={linkClass('/')}>
                        <LayoutDashboard size={20} />
                        <span>Painel</span>
                    </Link>
                    <Link to="/employees" className={linkClass('/employees')}>
                        <Users size={20} />
                        <span>Equipe</span>
                    </Link>
                    <Link to="/calendar" className={linkClass('/calendar')}>
                        <Calendar size={20} />
                        <span>Férias</span>
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
                    v1.4.0 • Skina Beer
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/50 via-background to-background">
                <div className="max-w-6xl mx-auto p-8 md:p-12">
                    {children}
                </div>
            </main>

            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
            {showProfileModal && <UserProfileModal onClose={() => setShowProfileModal(false)} />}
        </div>
    );
}
