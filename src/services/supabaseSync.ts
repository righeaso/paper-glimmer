import {supabase} from '../lib/supabase';
import {
  ChatMessage,
  DiaryEntry,
  IncomingGlimmer,
  MoodTag,
  ReactionKey,
  UnlockedConnection,
  UserProfile,
} from '../types/diary';

interface PostgrestErrorLike {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
}

interface RawProfileRow {
  id?: string;
  user_id?: string;
  nickname?: string;
  display_name?: string;
  username?: string;
  name?: string;
  bio?: string;
  writing_days?: number;
}

interface RawDiaryRow {
  id: string;
  author_id?: string;
  user_id?: string;
  author_name?: string;
  mood?: string;
  title?: string;
  content?: string;
  published_date?: string;
  entry_date?: string;
  is_edited?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface RawReactionRow {
  id?: string;
  diary_id: string;
  from_user_id?: string;
  user_id?: string;
  to_user_id?: string;
  reaction?: string;
  reaction_type?: string;
  created_at?: string;
}

interface RawMessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  content?: string;
  text?: string;
  created_at?: string;
}

const VALID_MOODS = new Set<string>(Object.values(MoodTag));
const VALID_REACTIONS = new Set<string>(Object.values(ReactionKey));

function normalizeMood(raw?: string): MoodTag {
  if (raw && VALID_MOODS.has(raw)) {
    return raw as MoodTag;
  }
  return MoodTag.CALM;
}

function normalizeReaction(raw?: string | null): ReactionKey | null {
  if (raw && VALID_REACTIONS.has(raw)) {
    return raw as ReactionKey;
  }
  return null;
}

function extractNickname(row?: RawProfileRow | null): string | null {
  if (!row) return null;
  const candidate =
    row.nickname || row.display_name || row.username || row.name || '';
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatPgError(err: PostgrestErrorLike): string {
  const parts = [err.code ? `[${err.code}] ${err.message}` : err.message];
  if (err.details) parts.push(err.details);
  if (err.hint) parts.push(err.hint);
  return parts.join(' — ');
}

function isMissingColumnError(err: PostgrestErrorLike): boolean {
  return (
    err.code === 'PGRST204' ||
    err.code === '42703' ||
    /column .* does not exist/i.test(err.message) ||
    /could not find the '.*' column/i.test(err.message)
  );
}

function formatDisplayTime(iso?: string): string {
  if (!iso) return '剛剛';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '剛剛';

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');

  if (isToday) {
    return `今天 ${hh}:${mm}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()} ${hh}:${mm}`;
}

function formatClockOnly(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function computeWritingDaysFromDiaries(diaries: DiaryEntry[]): number {
  if (diaries.length === 0) return 0;
  const uniqueDays = new Set<string>();
  for (const d of diaries) {
    const key = d.publishedDate || d.entryDate || d.createdAt.split(' ')[0] || d.id;
    uniqueDays.add(key);
  }
  return uniqueDays.size;
}

export interface SyncedSnapshot {
  profile: UserProfile | null;
  diaries: DiaryEntry[];
  incomingGlimmers: IncomingGlimmer[];
  connections: UnlockedConnection[];
}

export async function loadPublicDiariesFromSupabase(): Promise<{
  diaries: DiaryEntry[];
  error: string | null;
}> {
  if (!supabase) {
    return {diaries: [], error: null};
  }

  try {
    const {data: diaryRows, error: diaryErr} = await supabase
      .from('diaries')
      .select('*')
      .order('created_at', {ascending: false});

    if (diaryErr) {
      return {diaries: [], error: formatPgError(diaryErr)};
    }

    // Best-effort profile nickname lookup; gracefully fall back to author_name if anon profiles read is restricted
    const nameById = new Map<string, string>();
    const {data: allProfiles, error: profileErr} = await supabase
      .from('profiles')
      .select('id, nickname');

    if (!profileErr && Array.isArray(allProfiles)) {
      (allProfiles as RawProfileRow[]).forEach((p) => {
        const key = p.id || p.user_id;
        const nick = extractNickname(p);
        if (key && nick) {
          nameById.set(key, nick);
        }
      });
    }

    const mappedDiaries: DiaryEntry[] = (
      (diaryRows as RawDiaryRow[] | null) ?? []
    ).map((row) => {
      const authorId = row.author_id || row.user_id || '';
      const dateStr =
        row.published_date ||
        row.entry_date ||
        (row.created_at ? row.created_at.slice(0, 10) : undefined);

      return {
        id: row.id,
        authorId,
        userId: row.user_id || row.author_id,
        authorName: nameById.get(authorId) || row.author_name || '匿名筆友',
        createdAt: formatDisplayTime(row.created_at),
        publishedDate: dateStr,
        entryDate: dateStr,
        updatedAt: row.updated_at ? formatDisplayTime(row.updated_at) : undefined,
        isEdited: Boolean(row.is_edited),
        mood: normalizeMood(row.mood),
        title: row.title || '無題日記',
        content: row.content || '',
        isMine: false,
        myReaction: null,
        receivedReactions: [],
      };
    });

    return {diaries: mappedDiaries, error: null};
  } catch (err) {
    return {
      diaries: [],
      error: err instanceof Error ? err.message : '無法讀取公開日記牆',
    };
  }
}

export async function loadUserSnapshotFromSupabase(
  userId: string,
  fallbackProfile: UserProfile,
): Promise<{data: SyncedSnapshot | null; error: string | null}> {
  if (!supabase) {
    return {data: null, error: '尚未設定 Supabase 連線資訊'};
  }

  try {
    // 1. Load user's profile from `profiles`
    const {data: profileById, error: profileErr} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<RawProfileRow>();

    if (profileErr) {
      return {data: null, error: formatPgError(profileErr)};
    }

    let profileRow = profileById;
    if (!profileRow) {
      const {data: profileByUserId} = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle<RawProfileRow>();
      if (profileByUserId) {
        profileRow = profileByUserId;
      }
    }

    let resolvedProfile: UserProfile = {...fallbackProfile, writingDays: 0};
    const fetchedNickname = extractNickname(profileRow);

    if (profileRow) {
      resolvedProfile = {
        nickname: fetchedNickname || fallbackProfile.nickname,
        bio: profileRow.bio || fallbackProfile.bio,
        writingDays: 0,
      };
    } else {
      await syncProfileToSupabase(userId, resolvedProfile);
    }

    // 2. Load all profiles for author name lookup
    const {data: allProfiles} = await supabase.from('profiles').select('*');
    const nameById = new Map<string, string>();
    (allProfiles as RawProfileRow[] | null)?.forEach((p) => {
      const key = p.id || p.user_id;
      const nick = extractNickname(p);
      if (key && nick) {
        nameById.set(key, nick);
      }
    });
    nameById.set(userId, resolvedProfile.nickname);

    // 3. Load diaries
    const {data: diaryRows, error: diaryErr} = await supabase
      .from('diaries')
      .select('*')
      .order('created_at', {ascending: false});

    if (diaryErr) {
      return {data: null, error: formatPgError(diaryErr)};
    }

    // 4. Load reactions
    const {data: reactionRows, error: reactionErr} = await supabase
      .from('reactions')
      .select('*');

    if (reactionErr) {
      return {data: null, error: formatPgError(reactionErr)};
    }

    // 5. Load messages
    const {data: messageRows, error: msgErr} = await supabase
      .from('messages')
      .select('*')
      .order('created_at', {ascending: true});

    if (msgErr) {
      return {data: null, error: formatPgError(msgErr)};
    }

    const reactions = (reactionRows as RawReactionRow[] | null) ?? [];
    const messages = (messageRows as RawMessageRow[] | null) ?? [];

    const myReactionByDiaryId = new Map<string, ReactionKey>();
    const receivedByDiaryId = new Map<
      string,
      {fromAuthorId: string; fromAuthorName: string; reaction: ReactionKey}[]
    >();

    for (const r of reactions) {
      const fromId = r.from_user_id || r.user_id || '';
      const reactionKey = normalizeReaction(r.reaction || r.reaction_type);
      if (!fromId || !reactionKey) continue;

      if (fromId === userId) {
        myReactionByDiaryId.set(r.diary_id, reactionKey);
      } else {
        const list = receivedByDiaryId.get(r.diary_id) ?? [];
        list.push({
          fromAuthorId: fromId,
          fromAuthorName: nameById.get(fromId) || '匿名筆友',
          reaction: reactionKey,
        });
        receivedByDiaryId.set(r.diary_id, list);
      }
    }

    const mappedDiaries: DiaryEntry[] = (
      (diaryRows as RawDiaryRow[] | null) ?? []
    ).map((row) => {
      const authorId = row.author_id || row.user_id || '';
      const isMine = authorId === userId || row.user_id === userId;
      const dateStr =
        row.published_date ||
        row.entry_date ||
        (row.created_at ? row.created_at.slice(0, 10) : undefined);

      return {
        id: row.id,
        authorId,
        userId: row.user_id || row.author_id,
        authorName:
          nameById.get(authorId) ||
          row.author_name ||
          (isMine ? resolvedProfile.nickname : '匿名筆友'),
        createdAt: formatDisplayTime(row.created_at),
        publishedDate: dateStr,
        entryDate: dateStr,
        updatedAt: row.updated_at ? formatDisplayTime(row.updated_at) : undefined,
        isEdited: Boolean(row.is_edited),
        mood: normalizeMood(row.mood),
        title: row.title || '無題日記',
        content: row.content || '',
        isMine,
        myReaction: myReactionByDiaryId.get(row.id) ?? null,
        receivedReactions: receivedByDiaryId.get(row.id) ?? [],
      };
    });

    const myOwnDiaries = mappedDiaries.filter(
      (d) => d.authorId === userId || d.userId === userId,
    );
    resolvedProfile = {
      ...resolvedProfile,
      writingDays: computeWritingDaysFromDiaries(myOwnDiaries),
    };

    // Derive incoming glimmers & mutual connections strictly for current userId
    const myDiariesMap = new Map(myOwnDiaries.map((d) => [d.id, d]));
    const otherDiariesByAuthor = new Map<string, DiaryEntry>();
    for (const d of mappedDiaries) {
      if (
        d.authorId !== userId &&
        d.userId !== userId &&
        !otherDiariesByAuthor.has(d.authorId)
      ) {
        otherDiariesByAuthor.set(d.authorId, d);
      }
    }

    const myReactionToAuthor = new Map<
      string,
      {diary: DiaryEntry; reaction: ReactionKey}
    >();
    for (const d of mappedDiaries) {
      if (d.authorId !== userId && d.userId !== userId && d.myReaction) {
        myReactionToAuthor.set(d.authorId, {diary: d, reaction: d.myReaction});
      }
    }

    const incomingGlimmers: IncomingGlimmer[] = [];
    const connections: UnlockedConnection[] = [];
    const seenPartners = new Set<string>();

    for (const r of reactions) {
      const fromId = r.from_user_id || r.user_id || '';
      const reactionKey = normalizeReaction(r.reaction || r.reaction_type);
      const myDiary = myDiariesMap.get(r.diary_id);
      if (!fromId || fromId === userId || !reactionKey || !myDiary) continue;
      if (seenPartners.has(fromId)) continue;
      seenPartners.add(fromId);

      const partnerName = nameById.get(fromId) || '匿名筆友';
      const myResponse = myReactionToAuthor.get(fromId);

      if (myResponse) {
        const partnerMessages: ChatMessage[] = messages
          .filter(
            (m) =>
              (m.sender_id === userId && m.receiver_id === fromId) ||
              (m.sender_id === fromId && m.receiver_id === userId),
          )
          .map((m) => ({
            id: m.id,
            sender: m.sender_id === userId ? 'me' : 'partner',
            text: m.content || m.text || '',
            timestamp: formatClockOnly(m.created_at),
          }));

        connections.push({
          partnerId: fromId,
          partnerName,
          unlockedAt: formatDisplayTime(r.created_at),
          myDiaryTitle: myDiary.title,
          myDiaryExcerpt: myDiary.content,
          partnerReactionToMe: reactionKey,
          theirDiaryId: myResponse.diary.id,
          theirDiaryTitle: myResponse.diary.title,
          theirDiaryExcerpt: myResponse.diary.content,
          myReactionToThem: myResponse.reaction,
          messages: partnerMessages,
        });
      } else {
        const theirDiary = otherDiariesByAuthor.get(fromId);
        if (theirDiary) {
          incomingGlimmers.push({
            fromAuthorId: fromId,
            fromAuthorName: partnerName,
            reaction: reactionKey,
            myDiaryId: myDiary.id,
            myDiaryTitle: myDiary.title,
            myDiaryExcerpt: myDiary.content,
            theirDiaryId: theirDiary.id,
            reactedAt: formatDisplayTime(r.created_at),
          });
        }
      }
    }

    return {
      data: {
        profile: resolvedProfile,
        diaries: mappedDiaries,
        incomingGlimmers,
        connections,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : '同步 Supabase 資料時發生錯誤',
    };
  }
}

export async function syncProfileToSupabase(
  userId: string,
  profile: UserProfile,
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const {error} = await supabase.from('profiles').upsert({
      id: userId,
      nickname: profile.nickname.trim(),
      bio: profile.bio.trim(),
      writing_days: profile.writingDays,
      updated_at: new Date().toISOString(),
    });
    if (!error) return null;

    if (isMissingColumnError(error)) {
      const {error: minimalErr} = await supabase.from('profiles').upsert({
        id: userId,
        nickname: profile.nickname.trim(),
      });
      return minimalErr ? formatPgError(minimalErr) : null;
    }

    return formatPgError(error);
  } catch (err) {
    return err instanceof Error ? err.message : '無法更新個人檔案';
  }
}

/**
 * 統一寫入 user_id 與 author_id（同時相容既有欄位並支援 upsert 上傳未同步日記）
 */
export async function syncUpsertDiaryToSupabase(
  userId: string,
  diary: DiaryEntry,
  profileForBootstrap?: UserProfile,
): Promise<string | null> {
  if (!supabase) return null;
  try {
    // Ensure profiles row exists first in case diaries.author_id references profiles(id)
    if (profileForBootstrap) {
      await syncProfileToSupabase(userId, profileForBootstrap);
    }

    const entryDate =
      diary.publishedDate ||
      diary.entryDate ||
      new Date().toISOString().slice(0, 10);

    const baseFields = {
      id: diary.id,
      user_id: userId,
      author_id: userId,
      author_name: diary.authorName,
      mood: diary.mood,
      title: diary.title,
      content: diary.content,
      published_date: entryDate,
      entry_date: entryDate,
      is_edited: Boolean(diary.isEdited),
    };

    const candidatePayloads: Record<string, unknown>[] = [
      baseFields,
      // Omit entry_date if table only uses published_date
      {
        id: diary.id,
        user_id: userId,
        author_id: userId,
        author_name: diary.authorName,
        mood: diary.mood,
        title: diary.title,
        content: diary.content,
        published_date: entryDate,
        is_edited: Boolean(diary.isEdited),
      },
      // Omit published_date if table only uses entry_date
      {
        id: diary.id,
        user_id: userId,
        author_id: userId,
        author_name: diary.authorName,
        mood: diary.mood,
        title: diary.title,
        content: diary.content,
        entry_date: entryDate,
      },
      // Core unified payload (both user_id and author_id)
      {
        id: diary.id,
        user_id: userId,
        author_id: userId,
        mood: diary.mood,
        title: diary.title,
        content: diary.content,
      },
      // Legacy single-owner fallbacks only if one of user_id/author_id column is missing
      {
        id: diary.id,
        author_id: userId,
        author_name: diary.authorName,
        mood: diary.mood,
        title: diary.title,
        content: diary.content,
        published_date: entryDate,
      },
      {
        id: diary.id,
        user_id: userId,
        author_name: diary.authorName,
        mood: diary.mood,
        title: diary.title,
        content: diary.content,
        entry_date: entryDate,
      },
    ];

    let lastError: PostgrestErrorLike | null = null;

    for (const payload of candidatePayloads) {
      const {error} = await supabase
        .from('diaries')
        .upsert(payload, {onConflict: 'id'});
      if (!error) return null;

      lastError = error;
      if (!isMissingColumnError(error)) {
        return formatPgError(error);
      }
    }

    return lastError ? formatPgError(lastError) : '無法寫入日記至 Supabase';
  } catch (err) {
    return err instanceof Error ? err.message : '無法儲存日記到雲端';
  }
}

export async function syncUpdateDiaryToSupabase(
  userId: string,
  payload: {id: string; title: string; content: string; mood: MoodTag},
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const updateWithMeta = {
      title: payload.title,
      content: payload.content,
      mood: payload.mood,
      is_edited: true,
      updated_at: new Date().toISOString(),
    };

    const {error} = await supabase
      .from('diaries')
      .update(updateWithMeta)
      .eq('id', payload.id)
      .or(`author_id.eq.${userId},user_id.eq.${userId}`);

    if (!error) return null;

    if (!isMissingColumnError(error)) {
      return formatPgError(error);
    }

    // Fallback attempts if some optional columns (is_edited, updated_at, author_id/user_id) differ
    const updateCore = {
      title: payload.title,
      content: payload.content,
      mood: payload.mood,
    };

    const attempts = [
      () =>
        supabase!
          .from('diaries')
          .update(updateCore)
          .eq('id', payload.id)
          .or(`author_id.eq.${userId},user_id.eq.${userId}`),
      () =>
        supabase!
          .from('diaries')
          .update(updateCore)
          .eq('id', payload.id)
          .eq('author_id', userId),
      () =>
        supabase!
          .from('diaries')
          .update(updateCore)
          .eq('id', payload.id)
          .eq('user_id', userId),
    ];

    let lastError: PostgrestErrorLike = error;
    for (const attempt of attempts) {
      const res = await attempt();
      if (!res.error) return null;
      lastError = res.error;
      if (!isMissingColumnError(res.error)) {
        return formatPgError(res.error);
      }
    }

    return formatPgError(lastError);
  } catch (err) {
    return err instanceof Error ? err.message : '無法更新雲端日記';
  }
}

export async function syncReactionToSupabase(
  userId: string,
  diaryId: string,
  toUserId: string,
  reaction: ReactionKey | null,
): Promise<string | null> {
  if (!supabase) return null;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(toUserId)) {
    return null;
  }

  try {
    // 1. Query whether the current user already has a reaction on this diary
    let useUserIdColumn = false;
    let existingRow: RawReactionRow | null = null;

    const firstQuery = await supabase
      .from('reactions')
      .select('*')
      .eq('diary_id', diaryId)
      .eq('from_user_id', userId)
      .limit(1)
      .maybeSingle<RawReactionRow>();

    if (firstQuery.error) {
      if (!isMissingColumnError(firstQuery.error)) {
        return formatPgError(firstQuery.error);
      }
      // Fallback if table uses `user_id` instead of `from_user_id`
      useUserIdColumn = true;
      const altQuery = await supabase
        .from('reactions')
        .select('*')
        .eq('diary_id', diaryId)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle<RawReactionRow>();

      if (altQuery.error) {
        return formatPgError(altQuery.error);
      }
      existingRow = altQuery.data ?? null;
    } else {
      existingRow = firstQuery.data ?? null;
    }

    const actorColumn = useUserIdColumn ? 'user_id' : 'from_user_id';

    // 2. Handle deselection (remove existing reaction)
    if (!reaction) {
      if (!existingRow) return null;
      const deleteQuery = existingRow.id
        ? supabase.from('reactions').delete().eq('id', existingRow.id)
        : supabase
            .from('reactions')
            .delete()
            .eq('diary_id', diaryId)
            .eq(actorColumn, userId);

      const {error: delErr} = await deleteQuery;
      return delErr ? formatPgError(delErr) : null;
    }

    // 3. If a reaction record already exists, run UPDATE
    if (existingRow) {
      const updatePayloads: Record<string, unknown>[] = [
        {reaction},
        {reaction_type: reaction},
      ];

      let lastErr: PostgrestErrorLike | null = null;
      for (const payload of updatePayloads) {
        const updateQuery = existingRow.id
          ? supabase.from('reactions').update(payload).eq('id', existingRow.id)
          : supabase
              .from('reactions')
              .update(payload)
              .eq('diary_id', diaryId)
              .eq(actorColumn, userId);

        const {error: updErr} = await updateQuery;
        if (!updErr) return null;
        lastErr = updErr;
        if (!isMissingColumnError(updErr)) {
          return formatPgError(updErr);
        }
      }

      return lastErr ? formatPgError(lastErr) : '無法更新心情回應';
    }

    // 4. Otherwise, run INSERT
    const insertPayloads: Record<string, unknown>[] = [
      {
        diary_id: diaryId,
        from_user_id: userId,
        to_user_id: toUserId,
        reaction,
      },
      {
        diary_id: diaryId,
        from_user_id: userId,
        reaction,
      },
      {
        diary_id: diaryId,
        user_id: userId,
        to_user_id: toUserId,
        reaction,
      },
      {
        diary_id: diaryId,
        user_id: userId,
        reaction_type: reaction,
      },
    ];

    let lastInsertErr: PostgrestErrorLike | null = null;
    for (const payload of insertPayloads) {
      const {error: insErr} = await supabase.from('reactions').insert(payload);
      if (!insErr) return null;
      lastInsertErr = insErr;
      if (!isMissingColumnError(insErr)) {
        return formatPgError(insErr);
      }
    }

    return lastInsertErr ? formatPgError(lastInsertErr) : '無法新增心情回應';
  } catch (err) {
    return err instanceof Error ? err.message : '無法同步心情回應';
  }
}

export async function syncMessageToSupabase(
  userId: string,
  partnerId: string,
  content: string,
): Promise<string | null> {
  if (!supabase) return null;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(partnerId)) {
    return null;
  }

  try {
    const {error} = await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: partnerId,
      content: content.trim(),
    });
    return error ? formatPgError(error) : null;
  } catch (err) {
    return err instanceof Error ? err.message : '無法寄出雲端訊息';
  }
}
