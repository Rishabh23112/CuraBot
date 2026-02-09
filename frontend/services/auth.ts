// Google Sign-In Authentication Service
// Uses Google Identity Services (GIS) library

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: GoogleConfig) => void;
                    prompt: (callback?: (notification: PromptNotification) => void) => void;
                    renderButton: (element: HTMLElement, options: ButtonOptions) => void;
                    revoke: (hint: string, callback: () => void) => void;
                    cancel: () => void;
                };
            };
        };
    }
}

interface GoogleConfig {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
}

interface GoogleCredentialResponse {
    credential: string;
    select_by: string;
}

interface PromptNotification {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
}

interface ButtonOptions {
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: number;
}

export interface GoogleUser {
    credential: string;  // This is the ID token to send to backend
    email?: string;
    name?: string;
    picture?: string;
}

let isInitialized = false;
let googleScriptLoaded = false;

/**
 * Load Google Identity Services script
 */
function loadGoogleScript(): Promise<void> {
    if (googleScriptLoaded) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
            googleScriptLoaded = true;
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            googleScriptLoaded = true;
            resolve();
        };
        script.onerror = () => {
            reject(new Error('Failed to load Google Sign-In script'));
        };
        document.head.appendChild(script);
    });
}

/**
 * Initialize Google Sign-In
 */
export async function initializeGoogleAuth(): Promise<boolean> {
    if (isInitialized) return true;

    if (!GOOGLE_CLIENT_ID) {
        console.warn('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env.local');
        return false;
    }

    try {
        await loadGoogleScript();

        // Wait for google object to be available
        await new Promise<void>((resolve) => {
            const checkGoogle = () => {
                if (window.google?.accounts?.id) {
                    resolve();
                } else {
                    setTimeout(checkGoogle, 100);
                }
            };
            checkGoogle();
        });

        isInitialized = true;
        return true;
    } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
        return false;
    }
}

/**
 * Sign in with Google using popup flow
 * Returns the credential (ID token) to verify with backend
 */
export function signInWithGoogle(): Promise<GoogleUser> {
    return new Promise(async (resolve, reject) => {
        try {
            const initialized = await initializeGoogleAuth();

            if (!initialized || !window.google?.accounts?.id) {
                reject(new Error('Google Sign-In not available'));
                return;
            }

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (response: GoogleCredentialResponse) => {
                    if (response.credential) {
                        // Decode the JWT to get user info (for display purposes)
                        // The actual verification happens on the backend
                        const payload = parseJwt(response.credential);
                        resolve({
                            credential: response.credential,
                            email: payload?.email,
                            name: payload?.name,
                            picture: payload?.picture,
                        });
                    } else {
                        reject(new Error('No credential received'));
                    }
                },
                cancel_on_tap_outside: true,
            });

            // Trigger the sign-in prompt
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed()) {
                    // Fall back to rendering a button if prompt can't be displayed
                    console.log('Google One Tap not displayed, user may need to use button');
                }
                if (notification.isSkippedMoment() || notification.isDismissedMoment()) {
                    reject(new Error('Sign-in cancelled'));
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Render a Google Sign-In button in a container element
 */
export async function renderGoogleButton(containerId: string, callback: (user: GoogleUser) => void): Promise<void> {
    const initialized = await initializeGoogleAuth();

    if (!initialized || !window.google?.accounts?.id) {
        console.warn('Google Sign-In not available');
        return;
    }

    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: GoogleCredentialResponse) => {
            if (response.credential) {
                const payload = parseJwt(response.credential);
                callback({
                    credential: response.credential,
                    email: payload?.email,
                    name: payload?.name,
                    picture: payload?.picture,
                });
            }
        },
    });

    const container = document.getElementById(containerId);
    if (container) {
        window.google.accounts.id.renderButton(container, {
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 300,
        });
    }
}

/**
 * Sign out (revoke Google access)
 */
export async function signOut(email?: string): Promise<void> {
    if (!window.google?.accounts?.id || !email) {
        return;
    }

    return new Promise((resolve) => {
        window.google!.accounts.id.revoke(email, () => {
            resolve();
        });
    });
}

/**
 * Parse JWT token to get payload (for display purposes only)
 * NOT for security verification - that's done on the backend
 */
function parseJwt(token: string): { email?: string; name?: string; picture?: string; sub?: string } | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}
