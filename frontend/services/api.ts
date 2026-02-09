// API Service for CuraBot Backend Communication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatResponse {
    reply: string;
    reasoning?: string;
    citations?: string[];
}

export interface SessionInfo {
    session_id: string;
    title?: string;
    created_at?: string;
    updated_at?: string;
}

export interface SessionMessages {
    session_id: string;
    user_id: string;
    title: string;
    messages: Array<{
        role: string;
        content: string;
        timestamp: string;
    }>;
    created_at?: string;
    updated_at?: string;
}

export interface AuthResponse {
    success: boolean;
    user: {
        id: string;
        google_id?: string;
        name: string;
        email: string;
        avatar?: string;
    };
    token?: string;
}

/**
 * Verify Google token with backend and get user info
 */
export async function verifyGoogleToken(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Authentication failed' }));
        throw new Error(error.detail || 'Authentication failed');
    }

    return response.json();
}

/**
 * Register a new user with email/password
 */
export async function registerUser(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
}

/**
 * Login with email/password
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(error.detail || 'Login failed');
    }

    return response.json();
}

/**
 * Send a chat message to the backend
 */
export async function sendChatMessage(
    sessionId: string,
    message: string,
    userId?: string,
    userName?: string,
    userLocation?: string,
    file?: File,
    title?: string
): Promise<ChatResponse> {
    const formData = new FormData();
    formData.append('query', message);
    formData.append('session_id', sessionId);

    if (userId) {
        formData.append('user_id', userId);
    }
    if (userName) {
        formData.append('user_name', userName);
    }
    if (userLocation) {
        formData.append('user_location', userLocation);
    }
    if (title) {
        formData.append('title', title);
    }
    if (file) {
        formData.append('file', file);
    }

    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Chat request failed' }));
        throw new Error(error.detail || 'Chat request failed');
    }

    return response.json();
}

/**
 * Get all chat sessions for a user
 */
export async function getSessions(userId: string): Promise<SessionInfo[]> {
    const response = await fetch(`${API_URL}/sessions?user_id=${encodeURIComponent(userId)}`, {
        method: 'GET',
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to fetch sessions' }));
        throw new Error(error.detail || 'Failed to fetch sessions');
    }

    const data = await response.json();
    return data.sessions || [];
}

/**
 * Get a specific session with all messages
 */
export async function getSessionMessages(sessionId: string, userId: string): Promise<SessionMessages> {
    const response = await fetch(
        `${API_URL}/sessions/${encodeURIComponent(sessionId)}?user_id=${encodeURIComponent(userId)}`,
        { method: 'GET' }
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Session not found');
        }
        const error = await response.json().catch(() => ({ detail: 'Failed to fetch session' }));
        throw new Error(error.detail || 'Failed to fetch session');
    }

    return response.json();
}

/**
 * Delete a chat session
 */
export async function deleteSession(sessionId: string, userId: string): Promise<void> {
    const response = await fetch(
        `${API_URL}/sessions/${encodeURIComponent(sessionId)}?user_id=${encodeURIComponent(userId)}`,
        { method: 'DELETE' }
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Session not found');
        }
        const error = await response.json().catch(() => ({ detail: 'Failed to delete session' }));
        throw new Error(error.detail || 'Failed to delete session');
    }
}
