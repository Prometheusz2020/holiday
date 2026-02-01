import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Loader2, Info } from 'lucide-react';

export default function Login() {
    const { signIn, session } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [seedMessage, setSeedMessage] = useState('');

    useEffect(() => {
        if (session) navigate('/');
    }, [session, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await signIn(email, password);

        if (error) {
            setError('Erro ao entrar. Verifique email e senha.');
            setLoading(false);
        } else {
            // Redirect handled by useEffect
        }
    };



    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="card w-full max-w-md border-primary/20 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <Briefcase className="text-primary" size={40} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tighter">
                        Gestor<span className="text-primary">360</span>
                    </h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm text-center border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400">Senha</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-xs text-zinc-600">
                        Esqueceu a senha? Solicite ao administrador.
                    </p>

                </div>
            </div>
        </div>
    );
}
