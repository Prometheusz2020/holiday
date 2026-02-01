import { useState } from 'react';
import { useEmployeeController } from '../controllers/useEmployeeController';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, DollarSign, Calendar as CalIcon, Loader2, Pencil, X, Key } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Employees() {
    const { employees, createEmployee, removeEmployee, editEmployee } = useEmployeeController();
    const { loading } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        role: 'Garçom',
        salary: '',
        hireDate: '',
        pinCode: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        // For security, if pinCode is empty during edit, maybe we shouldn't send it?
        // But for simplicity, let's just send what we have. API/Controller should handle partial updates if needed,
        // or we assume overwrite. If creating, it's fine.

        let dataToSend = { ...formData };
        if (editingId && !dataToSend.pinCode) {
            delete dataToSend.pinCode; // Don't wipe PIN if empty on edit
        }

        if (editingId) {
            if (await editEmployee(editingId, dataToSend)) {
                resetForm();
            }
        } else {
            if (createEmployee(dataToSend)) {
                resetForm();
            }
        }
    };

    const handleEdit = (emp) => {
        setFormData({
            name: emp.name,
            role: emp.role,
            salary: emp.salary,
            hireDate: emp.hire_date || '',
            pinCode: '' // Don't show existing PIN for security, let them set new one
        });
        setEditingId(emp.id);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({ name: '', role: 'Garçom', salary: '', hireDate: '', pinCode: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const roles = ['CEO', 'Cozinheiro', 'Auxiliar Cozinha', 'Garçom', 'Gerente', 'Barman', 'Caixa', 'Serviços Gerais'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Gestão da Equipe
                    </h2>
                    <p className="text-zinc-400 mt-2 text-lg">Gerencie seus funcionários e cargos</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} />
                        <span>Adicionar Funcionário</span>
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card mb-10 animate-in slide-in-from-top-4 duration-300 border-l-4 border-l-primary">
                    <h3 className="text-xl font-bold mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
                        <span>{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</span>
                        <button onClick={resetForm} className="text-zinc-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Nome Completo</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="Ex: João da Silva"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Cargo</label>
                            <select
                                className="input-field appearance-none"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Salário Mensal (R$)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500">R$</span>
                                <input
                                    className="input-field pl-10"
                                    type="number"
                                    placeholder="2500.00"
                                    value={formData.salary}
                                    onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Data de Admissão</label>
                            <input
                                className="input-field"
                                type="date"
                                value={formData.hireDate}
                                onChange={e => setFormData({ ...formData, hireDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">PIN de Acesso (Ponto)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-zinc-500"><Key size={16} /></span>
                                <input
                                    className="input-field pl-10"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder={editingId ? "Preencha para alterar" : "Ex: 1234"}
                                    value={formData.pinCode}
                                    onChange={e => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>
                            <p className="text-xs text-zinc-500">4 a 6 dígitos numéricos.</p>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                            <button type="button" onClick={resetForm} className="btn-secondary">
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary">
                                {editingId ? 'Atualizar Dados' : 'Salvar Funcionário'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(emp => (
                    <div key={emp.id} className="card group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 relative">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                            <button
                                onClick={() => handleEdit(emp)}
                                className="p-2 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg border border-white/5 shadow-lg"
                                title="Editar"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                onClick={() => removeEmployee(emp.id)}
                                className="p-2 bg-zinc-800 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-white/5 shadow-lg"
                                title="Remover"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-xl font-bold text-primary shadow-inner">
                                {emp.name.charAt(0)}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{emp.name}</h3>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-zinc-300 border border-white/5">
                            {emp.role}
                        </span>

                        <div className="mt-8 space-y-3 text-sm text-zinc-400">
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50">
                                <div className="p-1.5 bg-green-500/10 rounded text-green-500">
                                    <DollarSign size={14} />
                                </div>
                                <span className="font-mono text-zinc-300">R$ {Number(emp.salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50">
                                <div className="p-1.5 bg-blue-500/10 rounded text-blue-500">
                                    <CalIcon size={14} />
                                </div>
                                <span>Desde: <span className="text-zinc-300">{emp.hire_date ? format(parseISO(emp.hire_date), 'd MMM yyyy', { locale: ptBR }) : 'N/A'}</span></span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
