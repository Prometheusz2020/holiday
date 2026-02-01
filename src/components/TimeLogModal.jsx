import { useState, useEffect } from 'react';
import { X, Save, Clock, Calendar as CalendarIcon, User } from 'lucide-react';

export default function TimeLogModal({ isOpen, onClose, employees, onSave, onUpdate, initialEmployeeId, editingLog }) {
    const [formData, setFormData] = useState({
        employeeId: '',
        date: '',
        time: '',
        type: 'IN'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingLog) {
                // Pre-fill for editing
                const dt = new Date(editingLog.timestamp);
                setFormData({
                    employeeId: editingLog.employee_id,
                    date: dt.toISOString().split('T')[0],
                    time: dt.toTimeString().slice(0, 5),
                    type: editingLog.type
                });
            } else {
                // Default for new
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hour = String(now.getHours()).padStart(2, '0');
                const minute = String(now.getMinutes()).padStart(2, '0');

                setFormData({
                    employeeId: initialEmployeeId !== 'ALL' ? initialEmployeeId : '',
                    date: `${year}-${month}-${day}`,
                    time: `${hour}:${minute}`,
                    type: 'IN'
                });
            }
        }
    }, [isOpen, initialEmployeeId, editingLog]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.date || !formData.time) return;

        setLoading(true);
        let success;

        if (editingLog) {
            success = await onUpdate(editingLog.id, formData);
        } else {
            success = await onSave(formData);
        }

        setLoading(false);

        if (success) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="text-primary" size={24} />
                        {editingLog ? 'Editar Registro' : 'Ajuste Manual'}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Employee */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Funcionário</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-zinc-500"><User size={16} /></span>
                            <select
                                className="input-field pl-10"
                                value={formData.employeeId}
                                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                required
                                disabled={!!editingLog}
                            >
                                <option value="">Selecione...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Data</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500"><CalendarIcon size={16} /></span>
                                <input
                                    type="date"
                                    className="input-field pl-10"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Hora</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500"><Clock size={16} /></span>
                                <input
                                    type="time"
                                    className="input-field pl-10"
                                    value={formData.time}
                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Tipo de Registro</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'IN' })}
                                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${formData.type === 'IN'
                                    ? 'bg-green-500 text-black border-green-500'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                                    }`}
                            >
                                Entrada
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'OUT' })}
                                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${formData.type === 'OUT'
                                    ? 'bg-orange-500 text-black border-orange-500'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                                    }`}
                            >
                                Saída
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="animate-pulse">Salvando...</span> : <><Save size={20} /> Salvar Ajuste</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
