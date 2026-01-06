/**
 * SmartTask360 — Comments types
 */

export interface Comment {
  id: string;
  task_id: string;
  author_id: string | null;
  author_type: string; // "user" | "ai"
  content: string;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentCreate {
  task_id: string;
  content: string;
  reply_to_id?: string | null;
}

export interface CommentUpdate {
  content: string;
}

export interface Reaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionCreate {
  emoji: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  user_ids: string[];
  has_current_user: boolean;
}
