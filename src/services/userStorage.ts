import {
  BlockedUserItem,
  DiaryEntry,
  UnlockedConnection,
  UserProfile,
} from '../types/diary';

const PREFIX = 'paper_glimmer_';

function getKey(base: string, userId: string): string {
  return `${PREFIX}${base}_${userId}`;
}

export interface CachedUserData {
  profile: UserProfile | null;
  myDiaries: DiaryEntry[] | null;
  connections: UnlockedConnection[] | null;
  blockedUsers: BlockedUserItem[] | null;
}

export function loadUserCache(userId: string): CachedUserData {
  if (typeof window === 'undefined' || !userId) {
    return {
      profile: null,
      myDiaries: null,
      connections: null,
      blockedUsers: null,
    };
  }

  const safeParse = <T,>(key: string): T | null => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  };

  const rawBlocked = safeParse<Array<string | BlockedUserItem>>(
    getKey('blocked', userId),
  );
  const blockedUsers: BlockedUserItem[] | null = rawBlocked
    ? rawBlocked.map((item) =>
        typeof item === 'string'
          ? {userId: item, name: '匿名筆友'}
          : item,
      )
    : null;

  return {
    profile: safeParse<UserProfile>(getKey('profile', userId)),
    myDiaries: safeParse<DiaryEntry[]>(getKey('diaries', userId)),
    connections: safeParse<UnlockedConnection[]>(getKey('connections', userId)),
    blockedUsers,
  };
}

export function saveUserProfileCache(userId: string, profile: UserProfile): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(
      getKey('profile', userId),
      JSON.stringify(profile),
    );
  } catch {
    // Ignore quota errors
  }
}

export function saveUserDiariesCache(userId: string, diaries: DiaryEntry[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    // Only persist diaries strictly owned by this userId
    const owned = diaries.filter(
      (d) => d.authorId === userId || d.userId === userId,
    );
    window.localStorage.setItem(getKey('diaries', userId), JSON.stringify(owned));
  } catch {
    // Ignore quota errors
  }
}

export function saveUserConnectionsCache(
  userId: string,
  connections: UnlockedConnection[],
): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(
      getKey('connections', userId),
      JSON.stringify(connections),
    );
  } catch {
    // Ignore quota errors
  }
}

export function saveUserBlockedUsersCache(
  userId: string,
  blockedUsers: BlockedUserItem[],
): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(
      getKey('blocked', userId),
      JSON.stringify(blockedUsers),
    );
  } catch {
    // Ignore quota errors
  }
}

/**
 * 徹底清除所有非當前 user.id 的 paper_glimmer_* 本機快取；
 * 若 activeUserId 為 null（登出），則清除所有 paper_glimmer_* 快取。
 */
export function purgeForeignUserCaches(activeUserId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      if (!activeUserId || !key.endsWith(`_${activeUserId}`)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors
  }
}
