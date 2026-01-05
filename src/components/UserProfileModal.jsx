import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { X, User, Loader2, Check, Mail } from 'lucide-react';

export default function UserProfileModal({ onClose }) {
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        fullName: ''
    });

    useEffect(() => {
        if (session?.user) {
            setFormData({
                email: session.user.email,
                fullName: session.user.user_metadata?.full_name || ''
            });
        }
    }, [session]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const updates = {
            data: { full_name: formData.fullName }
        };

        if (formData.email !== session.user.email) {
            updates.email = formData.email;
        }

        const { error } = await supabase.auth.updateUser(updates);

        if (error) {
            setError('Erro ao atualizar perfil: ' + error.message);
        } else {
            setSuccess('Dados atualizados com sucesso!' + (updates.email ? ' Verifique seu novo email para confirmar.' : ''));
            setTimeout(() => {
                if (!updates.email) onClose();
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-in fade-in duration-200">
            <div className="card w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border-zinc-700 bg-surface">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <User size={18} className="text-primary" />
                        Meus Dados
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                </div>

                {success && !formData.email.includes('@') ? ( // Simple check, better valid logic below
                    <div className="py-8 text-center flex flex-col items-center gap-3 animate-in fade-in">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                            <Check size={24} />
                        </div>
                        <p className="text-green-500 font-medium">{success}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="text-xs text-green-400 bg-green-400/10 p-2 rounded border border-green-400/20">
                                {success}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Nome Completo</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-zinc-500" />
                                <input
                                    type="email"
                                    className="input-field pl-10"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            {formData.email !== session?.user?.email && (
                                <p className="text-xs text-yellow-500">
                                    Alterar o email exigirá confirmação no novo endereço.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                            <button type="submit" disabled={loading} className="btn-primary text-sm flex items-center gap-2">
                                {loading && <Loader2 className="animate-spin" size={14} />}
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
