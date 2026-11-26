export enum MoodTag {
  CALM = '平靜',
  GLIMMER = '微光',
  LOW = '低潮',
  THOUGHTFUL = '思考',
}

export type MoodFilter = '全部' | MoodTag;

export enum ReactionKey {
  PAT = '暖心拍拍',
  RESONATE = '深深共鳴',
  CHEER = '替你加油',
  SMILE = '會心一笑',
}

export interface ReactionOption {
  key: ReactionKey;
  label: string;
  emoji: string;
}

export interface DiaryEntry {
  id: string;
  authorId: string;
  userId?: string;
  authorName: string;
  createdAt: string;
  publishedDate?: string;
  entryDate?: string;
  updatedAt?: string;
  isEdited?: boolean;
  mood: MoodTag;
  title: string;
  content: string;
  isMine?: boolean;
  /** Reaction I gave to this diary (if any) */
  myReaction?: ReactionKey | null;
  /** Simulated reactions received on my own diaries */
  receivedReactions?: {
    fromAuthorId: string;
    fromAuthorName: string;
    reaction: ReactionKey;
  }[];
}

export interface IncomingGlimmer {
  fromAuthorId: string;
  fromAuthorName: string;
  reaction: ReactionKey;
  myDiaryId: string;
  myDiaryTitle: string;
  myDiaryExcerpt: string;
  theirDiaryId: string;
  reactedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'partner';
  text: string;
  timestamp: string;
}

export interface UnlockedConnection {
  partnerId: string;
  partnerName: string;
  unlockedAt: string;
  myDiaryTitle: string;
  myDiaryExcerpt: string;
  partnerReactionToMe: ReactionKey;
  theirDiaryId: string;
  theirDiaryTitle: string;
  theirDiaryExcerpt: string;
  myReactionToThem: ReactionKey;
  messages: ChatMessage[];
}

export interface UserProfile {
  nickname: string;
  bio: string;
  writingDays: number;
}

export type TabKey = 'wall' | 'write' | 'connections' | 'notebook';
