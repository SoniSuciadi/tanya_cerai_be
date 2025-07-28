export interface ChatResponseDto {
  count: number;
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export interface Message {
  count: number;
  id: string;
  sessionId: string;
  content: string;
  sender: 'user' | 'consultant';
  timestamp: Date;
}
