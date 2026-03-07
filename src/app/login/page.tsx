"use client";

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { configureAmplify } from '@/aws-exports';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Separate component to handle redirect logic
function RedirectOnAuth({ user }: { user: any }) {
    const router = useRouter();
    
    useEffect(() => {
        if (user) {
            router.push('/app');
        }
    }, [user, router]);
    
    return <div></div>;
}

export default function LoginPage() {
    const [configured, setConfigured] = useState(false);
    const router = useRouter();

    useEffect(() => {
        configureAmplify();
        setConfigured(true);
    }, []);

    if (!configured) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
                    <Button 
                        variant="ghost" 
                        onClick={() => router.push('/landing')}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <Stethoscope className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Pashu Krishi Rakshak</h1>
                        </div>
                    </div>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
                        <p className="text-muted-foreground">Sign in to access your veterinary dashboard</p>
                    </div>

                    <Authenticator>
                        {({ user }) => <RedirectOnAuth user={user} />}
                    </Authenticator>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-muted/50 py-4">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Secure authentication powered by AWS Cognito
                    </p>
                </div>
            </footer>
        </div>
    );
}
