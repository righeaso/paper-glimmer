import {
  MoodFilter,
  MoodTag,
  ReactionKey,
  ReactionOption,
  UserProfile,
} from '../types/diary';

export const MOOD_FILTERS: MoodFilter[] = [
  '全部',
  MoodTag.CALM,
  MoodTag.GLIMMER,
  MoodTag.LOW,
  MoodTag.THOUGHTFUL,
];

export const MOOD_OPTIONS: MoodTag[] = [
  MoodTag.CALM,
  MoodTag.GLIMMER,
  MoodTag.LOW,
  MoodTag.THOUGHTFUL,
];

export const REACTION_OPTIONS: ReactionOption[] = [
  {key: ReactionKey.PAT, label: '暖心拍拍', emoji: '🤗'},
  {key: ReactionKey.RESONATE, label: '深深共鳴', emoji: '✨'},
  {key: ReactionKey.CHEER, label: '替你加油', emoji: '🌱'},
  {key: ReactionKey.SMILE, label: '會心一笑', emoji: '☕'},
];

export const WRITING_PROMPTS: string[] = [
  '今天有哪個瞬間讓你覺得被療癒了？',
  '如果把今天的心情折成一張信紙，你想對誰說些什麼？',
  '最近一次停下腳步好好呼吸，是在什麼樣的場景裡？',
  '有沒有一個微小的日常習慣，悄悄撐住了這陣子的你？',
  '此刻窗外的光線或天氣，讓你聯想到了什麼記憶？',
  '寫一件今天雖然有點遺憾，但仍想溫柔看待的小事。',
];

export const DEFAULT_EMPTY_PROFILE: UserProfile = {
  nickname: '匿名筆友',
  bio: '',
  writingDays: 0,
};

/**
 * GitHub Release APK 下載網址（支援環境變數 VITE_ANDROID_APK_URL 或直接填入固定網址）
 */
export const ANDROID_APK_DOWNLOAD_URL: string =
  (import.meta.env.VITE_ANDROID_APK_URL || '').trim();
