"use client";

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { configureAmplify } from '../aws-exports';
import { useEffect, useState } from 'react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [configured, setConfigured] = useState(false);

    useEffect(() => {
        configureAmplify();
        setConfigured(true);
    }, []);

    if (!configured) {
        return null; // Or a loading spinner
    }

    return (
        <Authenticator>
            {({ signOut, user }) => (
                <main className="w-full h-full">
                    {children}
                </main>
            )}
        </Authenticator>
    );
}
