const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`;

export const api = {
    async get(endpoint) {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error('Erro na requisição');
        return await response.json();
    },

    async post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    },

    async put(endpoint, data) {
        return this.request(endpoint, 'PUT', data);
    },

    async delete(endpoint) {
        const response = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Erro na requisição');
        return result;
    },

    async request(endpoint, method, data) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Erro na requisição');
        return result;
    }
};
