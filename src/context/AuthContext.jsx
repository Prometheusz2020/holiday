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
                const parsed = JSON.parse(storedSession);

                // Validate New Session Structure
                if (parsed?.user?.role !== 'master' && (!parsed.profile || !parsed.establishment)) {
                    console.warn("Legacy session detected. Clearing.");
                    localStorage.removeItem('holiday_session');
                    setSession(null);
                } else {
                    setSession(parsed);
                }
            } catch (e) {
                console.error("Failed to parse session", e);
                localStorage.removeItem('holiday_session');
            }
        }
        setLoading(false);
    }, []);

    const signIn = async (email, password) => {
        try {
            // Standard Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error("Auth Error:", error);
                return { error: 'Email ou senha inválidos.' };
            }

            // Fetch Profile & Establishment
            if (data.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*, establishment:establishments(*)') // Join establishment
                    .eq('id', data.user.id)
                    .single();

                if (profileError || !profile) {
                    console.error("Profile Error:", profileError);
                    await supabase.auth.signOut();
                    return { error: 'Perfil de usuário não encontrado.' };
                }

                const userSession = {
                    user: data.user,
                    profile: profile,
                    establishment: profile.establishment
                };

                setSession(userSession);
                localStorage.setItem('holiday_session', JSON.stringify(userSession));
                return { data: userSession, error: null };
            }
        } catch (err) {
            console.error(err);
            return { error: 'Erro interno de autenticação.' };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
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
