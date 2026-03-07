"use client";

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { configureAmplify } from '../aws-exports';
import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    signOut?: () => void;
    user?: {
        username: string;
        userId: string;
        signInDetails?: {
            loginId?: string;
        };
    };
}

const AuthContext = createContext<AuthContextType>({});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

export default function AuthProvider({ children, requireAuth = false }: AuthProviderProps) {
    const [configured, setConfigured] = useState(false);
    const [checking, setChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        configureAmplify();
        setConfigured(true);
    }, []);

    useEffect(() => {
        if (!configured || !requireAuth) return;

        const checkAuth = async () => {
            try {
                const { getCurrentUser } = await import('aws-amplify/auth');
                await getCurrentUser();
                setIsAuthenticated(true);
            } catch {
                setIsAuthenticated(false);
                router.push('/login');
            } finally {
                setChecking(false);
            }
        };

        checkAuth();
    }, [configured, requireAuth, router]);

    if (!configured) {
        return null;
    }

    // If requireAuth is true and we're still checking, show nothing
    if (requireAuth && checking) {
        return null;
    }

    // If requireAuth is true and not authenticated, show nothing (redirecting)
    if (requireAuth && !isAuthenticated) {
        return null;
    }

    // If requireAuth is false, show the Authenticator UI (for login page)
    if (!requireAuth) {
        return (
            <Authenticator>
                {({ signOut, user }) => (
                    <AuthContext.Provider value={{ signOut, user }}>
                        <main className="w-full h-full">
                            {children}
                        </main>
                    </AuthContext.Provider>
                )}
            </Authenticator>
        );
    }

    // If requireAuth is true and authenticated, render children with auth context
    return (
        <Authenticator>
            {({ signOut, user }) => (
                <AuthContext.Provider value={{ signOut, user }}>
                    <main className="w-full h-full">
                        {children}
                    </main>
                </AuthContext.Provider>
            )}
        </Authenticator>
    );
}
