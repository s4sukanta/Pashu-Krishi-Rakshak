import { Amplify } from 'aws-amplify';

let configured = false;

export const configureAmplify = () => {
    if (configured) return;
    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
                userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
            }
        },
    });
    configured = true;
};
