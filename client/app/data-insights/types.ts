export interface Knowledge {
  id: string;
  url?: string;
  content: string;
  title?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  embeddings?: number[];
}

export interface DataInstance {
  id: string;
  content: string;
  content_type: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  knowledge?: Knowledge[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Knowledge[];
  isGenerating?: boolean;
}

export interface UserStats {
  totalKnowledge: number;
  totalInstances: number;
  avgDailyActivity: number;
  knowledgeGrowth: number;
  topCategories: string[];
  streakDays: number;
  xpPoints: number;
  level: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface KnowledgeSummary {
  title: string;
  summary: string;
  icon: string;
}

export interface GeneratedContent {
  type: string;
  content: string;
} 