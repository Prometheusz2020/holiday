import { useState, useEffect } from 'react';
import { X, Save, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StatusModal({ isOpen, onClose, date, currentStatus, onSave, onDelete }) {
    const [status, setStatus] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentStatus) {
            setStatus(currentStatus.status || '');
            setDescription(currentStatus.description || '');
        } else {
            setStatus('');
            setDescription('');
        }
    }, [isOpen, currentStatus]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!status) return;

        setLoading(true);
        try {
            const success = await onSave(date, status, description);
            if (success) onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja remover este status?')) return;
        
        setLoading(true);
        try {
            const success = await onDelete(date, 'REMOVE');
            if (success) onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formattedDate = date ? format(new Date(date), "dd 'de' MMMM", { locale: ptBR }) : '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-secondary" size={24} />
                        Gerenciar Status
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="bg-white/5 p-4 rounded-lg flex items-center gap-3">
                        <AlertCircle className="text-blue-500" size={20} />
                        <div>
                            <p className="text-sm text-zinc-400">Data Selecionada</p>
                            <p className="font-bold text-lg capitalize">{formattedDate}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Status</label>
                        <select
                            className="input-field"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            required
                        >
                            <option value="">Selecione...</option>
                            <option value="FOLGA">Folga</option>
                            <option value="ATESTADO">Atestado Médico</option>
                            <option value="FALTA">Falta Injustificada</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Observação (Opcional)</label>
                        <textarea
                            className="input-field min-h-[100px] resize-none"
                            placeholder="Ex: Motivo da falta, detalhes do atestado..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                         {currentStatus && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors flex items-center justify-center"
                                title="Remover Status"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !status}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="animate-pulse">Salvando...</span> : <><Save size={20} /> Salvar Status</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
