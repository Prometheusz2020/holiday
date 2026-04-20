import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeSession = () => {
            const storedSession = localStorage.getItem('holiday_session');
            if (storedSession) {
                try {
                    setSession(JSON.parse(storedSession));
                } catch (e) {
                    console.error("Failed to parse stored session", e);
                    localStorage.removeItem('holiday_session');
                }
            }
            setLoading(false);
        };

        // Warm up backend (Render Cold Start mitigation)
        const warmUpBackend = async () => {
            try {
                await api.get('/health');
                console.log("[System] Backend warmed up.");
            } catch (e) {
                console.warn("[System] Warm up failed, backend might still be starting.", e);
            }
        };

        initializeSession();
        warmUpBackend();
    }, []);

    const signIn = async (email, password) => {
        try {
            const data = await api.post('/auth/login', { email, password });
            
            setSession(data);
            localStorage.setItem('holiday_session', JSON.stringify(data));
            return { data, error: null };
        } catch (err) {
            console.error(err);
            return { error: err.message || 'Erro interno de autenticação.' };
        }
    };

    const signOut = async () => {
        localStorage.removeItem('holiday_session');
        setSession(null);
        return { error: null };
    };

    return (
        <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
