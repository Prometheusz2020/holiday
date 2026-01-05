import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session from localStorage
        const storedSession = localStorage.getItem('holiday_session');
        if (storedSession) {
            try {
                setSession(JSON.parse(storedSession));
            } catch (e) {
                console.error("Failed to parse session", e);
                localStorage.removeItem('holiday_session');
            }
        }
        setLoading(false);
    }, []);

    const signIn = async (email, password) => {
        try {
            // Import dynamically or use the global utility function
            const { hashPassword } = await import('../utils/auth');
            const hashedPassword = await hashPassword(password);

            const { data, error } = await supabase
                .from('administrators')
                .select('*')
                .eq('email', email)
                .eq('password', hashedPassword)
                .single();

            if (error || !data) {
                return { error: 'Email ou senha inválidos.' };
            }

            // Create Master Session
            const newSession = {
                user: {
                    id: data.id,
                    email: data.email,
                    user_metadata: {
                        full_name: data.name
                    },
                    role: 'master'
                }
            };

            setSession(newSession);
            localStorage.setItem('holiday_session', JSON.stringify(newSession));
            return { data: newSession, error: null };

        } catch (err) {
            console.error(err);
            return { error: 'Erro interno de autenticação.' };
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
