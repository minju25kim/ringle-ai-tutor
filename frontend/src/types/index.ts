export interface User {
  id: string;
  name: string;
  email: string;
  customer_type: 'B2B' | 'B2C';
}

export interface Membership {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;
  expires_at: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  limits: {
    conversation: number | null;
    analysis: number | null;
  };
  usage: {
    conversation: number;
    analysis: number;
  };
}

export interface MembershipTemplate {
  id: string;
  name: string;
  customer_type: 'B2B' | 'B2C';
  duration_days: number;
  limits: {
    conversation: number | null;
    analysis: number | null;
  };
  price: number | null; // Price can be null for B2B templates
  is_active: boolean;
  description: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  audioUrl?: string; // Optional URL for audio playback
}