import { useState } from 'react';
import { useMasterController } from '../controllers/useMasterController';
import { Plus, Search, ShieldCheck, Mail, Edit2, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';

export default function Masters() {
    const { masters, loading, addMaster, updateMaster, deleteMaster } = useMasterController();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingMaster, setEditingMaster] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '' });

    const filteredMasters = masters.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (master) => {
        setEditingMaster(master);
        setFormData({ name: master.name, email: master.email });
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingMaster(null);
        setFormData({ name: '', email: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = editingMaster
            ? await updateMaster(editingMaster.id, formData)
            : await addMaster(formData);

        if (success) {
            setShowModal(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Tem certeza que deseja remover este administrador?')) {
            await deleteMaster(id);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" size={40} /></div>;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Administradores</h2>
                    <p className="text-zinc-400 mt-2 text-lg">Gerenciamento de acesso Master</p>
                </div>
                <button onClick={handleAddNew} className="btn-primary flex items-center gap-2 shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-500 text-white border-none">
                    <Plus size={20} />
                    <span>Novo Admin</span>
                </button>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-6 flex items-center gap-4">
                <Search size={20} className="text-zinc-500" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    className="bg-transparent border-none focus:ring-0 text-white w-full placeholder-zinc-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMasters.map(master => (
                    <div key={master.id} className="card group hover:border-red-500/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {master.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(master)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(master.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{master.name}</h3>
                        <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
                            <Mail size={14} />
                            {master.email}
                        </div>

                        <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-bold inline-flex items-center gap-1 uppercase tracking-wider">
                            <ShieldCheck size={12} />
                            Acesso Total
                        </div>
                    </div>
                ))}
            </div>

            {filteredMasters.length === 0 && (
                <div className="text-center py-20 border border-dashed border-zinc-700 rounded-xl">
                    <p className="text-zinc-500 text-lg">Nenhum administrador encontrado.</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="card w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-zinc-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">
                                {editingMaster ? 'Editar Admin' : 'Novo Admin'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    className="input-field w-full"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Email de Acesso</label>
                                <input
                                    type="email"
                                    className="input-field w-full"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 text-xs flex gap-2 items-start">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p>Atenção: Cadastrar aqui <strong>não cria</strong> a conta de login automaticamente. O usuário deve se cadastrar com este email ou você deve criar no painel Supabase Auth.</p>
                            </div>

                            <button type="submit" className="btn-primary w-full bg-red-600 hover:bg-red-500 border-none text-white">
                                Salvar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
