"use client";

import { configureAmplify } from '../aws-exports';
import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
    username: string;
    userId: string;
    signInDetails?: {
        loginId?: string;
    };
}

interface AuthContextType {
    signOut?: () => void;
    user?: AuthUser;
}

const AuthContext = createContext<AuthContextType>({});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

export default function AuthProvider({ children, requireAuth = false }: AuthProviderProps) {
    const [checking, setChecking] = useState(true);
    const [authState, setAuthState] = useState<AuthContextType>({});
    const router = useRouter();

    useEffect(() => {
        configureAmplify();

        const initAuth = async () => {
            try {
                const { getCurrentUser, signOut } = await import('aws-amplify/auth');
                const user = await getCurrentUser();
                setAuthState({
                    signOut: async () => {
                        await signOut();
                        router.push('/landing');
                    },
                    user: user as AuthUser,
                });
            } catch {
                if (requireAuth) {
                    router.push('/landing');
                }
            } finally {
                setChecking(false);
            }
        };

        initAuth();
    }, [requireAuth, router]);

    if (checking) {
        return null;
    }

    if (requireAuth && !authState.user) {
        return null;
    }

    return (
        <AuthContext.Provider value={authState}>
            <main className="w-full h-full">
                {children}
            </main>
        </AuthContext.Provider>
    );
}
