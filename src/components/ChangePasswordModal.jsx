import { useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Lock, Loader2, Check } from 'lucide-react';

export default function ChangePasswordModal({ onClose }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setError('Erro ao atualizar senha: ' + error.message);
        } else {
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="card w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border-zinc-700 bg-surface">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Lock size={18} className="text-primary" />
                        Alterar Senha
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                </div>

                {success ? (
                    <div className="py-8 text-center flex flex-col items-center gap-3 animate-in fade-in">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                            <Check size={24} />
                        </div>
                        <p className="text-green-500 font-medium">Senha alterada com sucesso!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Nova Senha</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                            <button type="submit" disabled={loading} className="btn-primary text-sm flex items-center gap-2">
                                {loading && <Loader2 className="animate-spin" size={14} />}
                                Salvar Nova Senha
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
