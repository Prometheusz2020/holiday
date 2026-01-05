import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM', { locale: ptBR });
};

export const generateWaLink = (text) => {
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/?text=${encodedText}`;
};

export const openWhatsApp = (text) => {
    window.open(generateWaLink(text), '_blank');
};
