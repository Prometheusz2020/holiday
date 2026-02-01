import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize session checking Supabase state
        const initializeSession = async () => {
            try {
                // Check active session with Supabase
                const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();

                if (error) {
                    if (error.message.includes("Invalid Refresh Token") || error.message.includes("Refresh Token Not Found")) {
                        console.warn("Invalid Supabase Token, clearing session.");
                        await signOut();
                        return;
                    }
                    console.error("Supabase Session Error:", error);
                }

                // If Supabase has a session, try to sync with our enhanced local session
                if (supabaseSession) {
                    const storedSession = localStorage.getItem('holiday_session');
                    if (storedSession) {
                        try {
                            const parsed = JSON.parse(storedSession);
                            // Verify if it Matches
                            if (parsed?.user?.id === supabaseSession.user.id) {
                                setSession(parsed);
                            } else {
                                // Mismatch or invalid, force logout
                                await signOut();
                            }
                        } catch (e) {
                            console.error("Failed to parse stored session", e);
                            await signOut();
                        }
                    } else {
                        // We have Supabase session but no local data (profile/establishment)
                        // This is a "Partial" state. We should probably sign out or re-fetch.
                        // For safety/simplicity in this fix, we sign out to force clean login.
                        console.warn("Supabase session exists but local data missing. Signing out.");
                        await signOut();
                    }
                } else {
                    // No Supabase session
                    const storedSession = localStorage.getItem('holiday_session');
                    if (storedSession) {
                        // We have local data but Supabase says we are logged out
                        await signOut();
                    }
                }
            } catch (err) {
                console.error("Session initialization error:", err);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };

        initializeSession();

        // Listen for Auth Changes from Supabase (e.g. Token Refresh, Sign Out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('holiday_session');
                setSession(null);
            }
            if (event === 'TOKEN_REFRESHED') {
                // Good to know, but we rely on the initial sign-in data for profile info
                // If we wanted to update the 'session' state with the new token, we could.
            }
        });

        return () => {
            subscription.unsubscribe();
        };
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
