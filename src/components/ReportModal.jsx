import { X, Share2, FileText } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, title, columns, data, footer, onShare }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-in fade-in duration-200">
            <div className="card w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 border-zinc-700 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4 flex-shrink-0">
                    <div className="flex items-center gap-2 text-primary">
                        <FileText size={20} />
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/10">
                        <X size={20} />
                    </button>
                </div>

                {/* Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto min-h-0 -mr-2 pr-2">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {columns.map((col, idx) => (
                                        <th key={idx} className="p-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="p-8 text-center text-zinc-500 italic">
                                            Nenhum dado para exibir.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                                            {columns.map((col, cIdx) => (
                                                <td key={cIdx} className={`p-3 text-sm ${col.className || 'text-zinc-300'}`}>
                                                    {typeof col.cell === 'function' ? col.cell(row) : row[col.accessor]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {footer && (
                        <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-white/5">
                            {footer}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5 flex-shrink-0">
                    <button onClick={onClose} className="btn-secondary">Fechar</button>
                    <button onClick={onShare} className="btn-primary flex items-center gap-2">
                        <Share2 size={18} />
                        <span>Enviar no WhatsApp</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
