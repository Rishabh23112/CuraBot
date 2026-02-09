export interface User {
  id: string;
  name: string;
  email: string;
  address?: string;
  avatar?: string;
  token?: string;  // Google ID token for API authentication
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'image' | 'file';
  url: string;
  mimeType: string;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

export interface MoodEntry {
  date: string;
  score: number; // 1-10
  note: string;
}

export enum Page {
  HOME = 'HOME',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  PROGRESS = 'PROGRESS',
  SETTINGS = 'SETTINGS'
}