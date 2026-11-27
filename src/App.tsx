import {useCallback, useEffect, useRef, useState} from 'react';
import {BookOpen, BookMarked, HeartHandshake, PenLine, X} from 'lucide-react';
import {AndroidApkDownloadButton} from './components/AndroidApkDownloadButton';
import {IOSPwaGuide} from './components/IOSPwaGuide';
import {AuthModal, type AuthActionResult} from './components/AuthModal';
import {ConnectionsTab} from './components/ConnectionsTab';
import {DiaryWall} from './components/DiaryWall';
import {MyNotebookTab} from './components/MyNotebookTab';
import {PrivacyPolicyPage} from './components/PrivacyPolicyPage';
import {PWAInstallButton} from './components/PWAInstallButton';
import {SafetyModals} from './components/SafetyModals';
import {UnlockBanner} from './components/UnlockBanner';
import {WriteDiary} from './components/WriteDiary';
import {DEFAULT_EMPTY_PROFILE} from './data/diaryConstants';
import {
  getSupabaseEnvDiagnostic,
  isSupabaseConfigured,
  supabase,
} from './lib/supabase';
import {
  computeWritingDaysFromDiaries,
  loadUserSnapshotFromSupabase,
  syncMessageToSupabase,
  syncProfileToSupabase,
  syncReactionToSupabase,
  syncUpdateDiaryToSupabase,
  syncUpsertDiaryToSupabase,
} from './services/supabaseSync';
import {
  loadUserCache,
  purgeForeignUserCaches,
  saveUserBlockedUsersCache,
  saveUserConnectionsCache,
  saveUserDiariesCache,
  saveUserProfileCache,
} from './services/userStorage';
import {
  BlockedUserItem,
  DiaryEntry,
  IncomingGlimmer,
  MoodFilter,
  MoodTag,
  ReactionKey,
  SafetyTarget,
  TabKey,
  UnlockedConnection,
  UserProfile,
} from './types/diary';

function formatCurrentTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatTodayDateKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function generateDiaryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isOwnedByActor(diary: DiaryEntry, actorId: string): boolean {
  return diary.authorId === actorId || diary.userId === actorId;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );
  const [activeTab, setActiveTab] = useState<TabKey>('wall');
  const [activeFilter, setActiveFilter] = useState<MoodFilter>('全部');

  const [userProfile, setUserProfile] = useState<UserProfile>(
    DEFAULT_EMPTY_PROFILE,
  );
  const [myDiaries, setMyDiaries] = useState<DiaryEntry[]>([]);
  const [wallDiaries, setWallDiaries] = useState<DiaryEntry[]>([]);

  const [pendingGlimmers, setPendingGlimmers] = useState<IncomingGlimmer[]>([]);
  const [unlockedConnections, setUnlockedConnections] = useState<
    UnlockedConnection[]
  >([]);

  const [highlightedDiaryId, setHighlightedDiaryId] = useState<string | null>(
    null,
  );
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

  const [bannerInfo, setBannerInfo] = useState<{
    partnerId: string;
    partnerName: string;
  } | null>(null);

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [reportTarget, setReportTarget] = useState<SafetyTarget | null>(null);
  const [blockTarget, setBlockTarget] = useState<SafetyTarget | null>(null);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const bannerTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const activeAuthIdRef = useRef<string | null>(null);
  const myDiariesRef = useRef<DiaryEntry[]>(myDiaries);
  myDiariesRef.current = myDiaries;
  const unlockedConnectionsRef =
    useRef<UnlockedConnection[]>(unlockedConnections);
  unlockedConnectionsRef.current = unlockedConnections;

  const clearPendingTimers = useCallback(() => {
    if (bannerTimerRef.current) {
      window.clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const navigateTo = useCallback((path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    setIsAuthModalOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /**
   * 切換帳號或登出時，徹底清空記憶體 state 與其他帳號的 localStorage 快取
   */
  const resetStateForAccount = useCallback(
    (nextUserId: string | null, metadataNickname?: string, email?: string | null) => {
      clearPendingTimers();
      purgeForeignUserCaches(nextUserId);

      setBannerInfo(null);
      setHighlightedDiaryId(null);
      setActivePartnerId(null);
      setReportTarget(null);
      setBlockTarget(null);
      setSafetyNotice(null);
      setSyncError(null);
      setSyncNotice(null);

      if (!nextUserId) {
        setUserProfile(DEFAULT_EMPTY_PROFILE);
        setMyDiaries([]);
        setWallDiaries([]);
        setPendingGlimmers([]);
        setUnlockedConnections([]);
        setBlockedUsers([]);
        return;
      }

      const emailFallbackNick = email?.split('@')[0]?.trim();
      const fallbackNick =
        metadataNickname?.trim() ||
        emailFallbackNick ||
        DEFAULT_EMPTY_PROFILE.nickname;

      const cached = loadUserCache(nextUserId);
      const cachedMyDiaries = (cached.myDiaries ?? []).filter((d) =>
        isOwnedByActor(d, nextUserId),
      );

      const initialProfile: UserProfile = cached.profile
        ? {
            ...cached.profile,
            writingDays: computeWritingDaysFromDiaries(cachedMyDiaries),
          }
        : {
            ...DEFAULT_EMPTY_PROFILE,
            nickname: fallbackNick,
            writingDays: computeWritingDaysFromDiaries(cachedMyDiaries),
          };

      setUserProfile(initialProfile);
      setMyDiaries(cachedMyDiaries);
      setWallDiaries(cachedMyDiaries);
      setUnlockedConnections(cached.connections ?? []);
      setBlockedUsers(cached.blockedUsers ?? []);
      setPendingGlimmers([]);
    },
    [clearPendingTimers],
  );

  /**
   * 雙向同步流程：
   * 1) 先讀取雲端現有資料並找出「本機有但雲端尚未寫入」的該帳號日記
   * 2) 將未同步的本機日記 upsert 上傳至 Supabase
   * 3) 合併雲端與本機資料（絕不用空的雲端陣列覆蓋本機日記），若寫入失敗則保留本機並顯示具體錯誤
   */
  const syncFromCloud = useCallback(
    async (
      userId: string,
      metadataNickname?: string,
      showSuccessNotice = false,
      email?: string | null,
    ) => {
      setIsSyncing(true);
      setSyncError(null);
      setSyncNotice(null);

      const emailFallbackNick = email?.split('@')[0]?.trim();
      const fallbackForUser: UserProfile = {
        ...DEFAULT_EMPTY_PROFILE,
        nickname:
          metadataNickname?.trim() ||
          emailFallbackNick ||
          DEFAULT_EMPTY_PROFILE.nickname,
        writingDays: 0,
      };

      // Gather all local diaries strictly owned by this userId (memory + user-scoped cache)
      const cachedBefore = loadUserCache(userId);
      const localMap = new Map<string, DiaryEntry>();
      for (const d of cachedBefore.myDiaries ?? []) {
        if (isOwnedByActor(d, userId)) {
          localMap.set(d.id, d);
        }
      }
      for (const d of myDiariesRef.current) {
        if (isOwnedByActor(d, userId)) {
          localMap.set(d.id, d);
        }
      }
      const localOwnedDiaries = Array.from(localMap.values());

      // Step 1: Fetch current remote snapshot
      const initialFetch = await loadUserSnapshotFromSupabase(
        userId,
        fallbackForUser,
      );

      if (activeAuthIdRef.current !== userId) {
        return;
      }

      if (initialFetch.error || !initialFetch.data) {
        setIsSyncing(false);
        setSyncError(initialFetch.error || '無法讀取雲端資料');
        return;
      }

      let remoteData = initialFetch.data;
      const remoteMyIds = new Set(
        remoteData.diaries
          .filter((d) => isOwnedByActor(d, userId))
          .map((d) => d.id),
      );

      // Step 2: Upload any local diaries of this user that aren't in Supabase yet
      const unsyncedLocalDiaries = localOwnedDiaries.filter(
        (d) => !remoteMyIds.has(d.id),
      );

      let uploadedCount = 0;
      let uploadError: string | null = null;

      for (const localDiary of unsyncedLocalDiaries) {
        const err = await syncUpsertDiaryToSupabase(
          userId,
          localDiary,
          remoteData.profile ?? fallbackForUser,
        );
        if (err) {
          uploadError = err;
          break;
        }
        uploadedCount += 1;
      }

      if (activeAuthIdRef.current !== userId) {
        return;
      }

      // Re-fetch from Supabase if new diaries were uploaded so server timestamps/state match
      if (uploadedCount > 0) {
        const refreshed = await loadUserSnapshotFromSupabase(
          userId,
          fallbackForUser,
        );
        if (activeAuthIdRef.current !== userId) {
          return;
        }
        if (refreshed.data && !refreshed.error) {
          remoteData = refreshed.data;
        }
      }

      setIsSyncing(false);

      // Step 3: Merge remote + any still-unsynced local diaries (never wipe local!)
      const remoteMyDiaries = remoteData.diaries.filter((d) =>
        isOwnedByActor(d, userId),
      );
      const remoteIdsAfterUpload = new Set(remoteMyDiaries.map((d) => d.id));
      const remainingLocalOnly = localOwnedDiaries.filter(
        (d) => !remoteIdsAfterUpload.has(d.id),
      );

      const mergedMyDiaries = [...remainingLocalOnly, ...remoteMyDiaries];
      const otherRemoteDiaries = remoteData.diaries.filter(
        (d) => !isOwnedByActor(d, userId),
      );

      const realWritingDays = computeWritingDaysFromDiaries(mergedMyDiaries);
      const resolvedProfile: UserProfile = {
        ...(remoteData.profile ?? fallbackForUser),
        writingDays: realWritingDays,
      };

      setUserProfile(resolvedProfile);
      saveUserProfileCache(userId, resolvedProfile);

      setMyDiaries(mergedMyDiaries);
      saveUserDiariesCache(userId, mergedMyDiaries);

      setWallDiaries([...mergedMyDiaries, ...otherRemoteDiaries]);

      setUnlockedConnections(remoteData.connections);
      saveUserConnectionsCache(userId, remoteData.connections);

      setPendingGlimmers(remoteData.incomingGlimmers);

      if (uploadError) {
        setSyncError(uploadError);
      } else if (showSuccessNotice) {
        setSyncNotice(
          uploadedCount > 0
            ? `已將 ${uploadedCount} 篇本機日記上傳並完成雲端同步（共 ${mergedMyDiaries.length} 篇）`
            : `已完成雲端同步（共 ${mergedMyDiaries.length} 篇個人日記）`,
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({data: {session}}) => {
      if (!mounted) return;
      const nextId = session?.user?.id ?? null;
      const nextEmail = session?.user?.email ?? null;
      const metaNickname =
        typeof session?.user?.user_metadata?.nickname === 'string'
          ? session.user.user_metadata.nickname
          : undefined;

      activeAuthIdRef.current = nextId;
      setAuthUserId(nextId);
      setAuthEmail(nextEmail);
      resetStateForAccount(nextId, metaNickname, nextEmail);

      if (nextId) {
        void syncFromCloud(nextId, metaNickname, false, nextEmail);
      }
    });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const nextId = session?.user?.id ?? null;
      const nextEmail = session?.user?.email ?? null;
      const metaNickname =
        typeof session?.user?.user_metadata?.nickname === 'string'
          ? session.user.user_metadata.nickname
          : undefined;

      const userChanged = activeAuthIdRef.current !== nextId;
      activeAuthIdRef.current = nextId;
      setAuthUserId(nextId);
      setAuthEmail(nextEmail);

      if (userChanged) {
        resetStateForAccount(nextId, metaNickname, nextEmail);
        if (nextId) {
          setIsAuthModalOpen(false);
          void syncFromCloud(nextId, metaNickname, false, nextEmail);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resetStateForAccount, syncFromCloud]);

  useEffect(() => {
    return () => {
      clearPendingTimers();
    };
  }, [clearPendingTimers]);

  const showUnlockBanner = useCallback(
    (partnerId: string, partnerName: string) => {
      setBannerInfo({partnerId, partnerName});
      if (bannerTimerRef.current) {
        window.clearTimeout(bannerTimerRef.current);
      }
      bannerTimerRef.current = window.setTimeout(() => {
        setBannerInfo(null);
      }, 6500);
    },
    [],
  );

  const todayDateStr = formatTodayDateKey();

  const todaysDiary = authUserId
    ? myDiaries.find(
        (d) =>
          isOwnedByActor(d, authUserId) &&
          (d.publishedDate === todayDateStr || d.entryDate === todayDateStr),
      ) ?? null
    : null;

  const handleToggleReaction = async (
    diaryId: string,
    reaction: ReactionKey,
  ) => {
    if (!authUserId) {
      setActiveTab('notebook');
      return;
    }

    const targetDiary = wallDiaries.find((d) => d.id === diaryId);
    if (!targetDiary || isOwnedByActor(targetDiary, authUserId)) return;

    const prevReaction = targetDiary.myReaction ?? null;
    const isDeselecting = prevReaction === reaction;
    const nextReaction = isDeselecting ? null : reaction;

    setWallDiaries((prev) =>
      prev.map((d) =>
        d.id === diaryId ? {...d, myReaction: nextReaction} : d,
      ),
    );

    setSyncError(null);
    const err = await syncReactionToSupabase(
      authUserId,
      diaryId,
      targetDiary.authorId,
      nextReaction,
    );

    if (activeAuthIdRef.current !== authUserId) {
      return;
    }

    if (err) {
      setWallDiaries((prev) =>
        prev.map((d) =>
          d.id === diaryId ? {...d, myReaction: prevReaction} : d,
        ),
      );
      setSyncError(`心意回應寫入失敗：${err}`);
      return;
    }

    // Re-read latest reactions & connections from Supabase to evaluate mutual unlock
    const refreshed = await loadUserSnapshotFromSupabase(
      authUserId,
      userProfile,
    );

    if (activeAuthIdRef.current !== authUserId) {
      return;
    }

    if (refreshed.error || !refreshed.data) {
      if (refreshed.error) {
        setSyncError(`重新讀取回應狀態失敗：${refreshed.error}`);
      }
      return;
    }

    const previouslyUnlockedIds = new Set(
      unlockedConnectionsRef.current.map((c) => c.partnerId),
    );
    const remoteData = refreshed.data;

    const remoteMyDiaries = remoteData.diaries.filter((d) =>
      isOwnedByActor(d, authUserId),
    );
    const remoteMyIds = new Set(remoteMyDiaries.map((d) => d.id));
    const localOnlyMyDiaries = myDiariesRef.current.filter(
      (d) => isOwnedByActor(d, authUserId) && !remoteMyIds.has(d.id),
    );
    const mergedMyDiaries = [...localOnlyMyDiaries, ...remoteMyDiaries];

    const otherRemoteDiaries = remoteData.diaries.filter(
      (d) => !isOwnedByActor(d, authUserId),
    );

    setMyDiaries(mergedMyDiaries);
    saveUserDiariesCache(authUserId, mergedMyDiaries);
    setWallDiaries([...mergedMyDiaries, ...otherRemoteDiaries]);

    setUnlockedConnections(remoteData.connections);
    saveUserConnectionsCache(authUserId, remoteData.connections);
    setPendingGlimmers(remoteData.incomingGlimmers);

    const remoteConnIds = new Set(
      remoteData.connections.map((c) => c.partnerId),
    );
    if (
      nextReaction &&
      remoteConnIds.has(targetDiary.authorId) &&
      !previouslyUnlockedIds.has(targetDiary.authorId)
    ) {
      showUnlockBanner(targetDiary.authorId, targetDiary.authorName);
    }
  };

  const handlePublishDiary = ({
    title,
    content,
    mood,
  }: {
    title: string;
    content: string;
    mood: MoodTag;
  }) => {
    if (!authUserId) {
      setActiveTab('notebook');
      return;
    }

    if (todaysDiary) {
      setSyncError('今天已經發布過一篇日記了，每日限發布一篇，當日仍可直接修改內容。');
      return;
    }

    const newId = generateDiaryId();
    const timeStr = `今天 ${formatCurrentTime()}`;
    const newEntry: DiaryEntry = {
      id: newId,
      authorId: authUserId,
      userId: authUserId,
      authorName: userProfile.nickname,
      createdAt: timeStr,
      publishedDate: todayDateStr,
      entryDate: todayDateStr,
      updatedAt: timeStr,
      isEdited: false,
      mood,
      title,
      content,
      isMine: true,
      receivedReactions: [],
    };

    const nextMyDiaries = [newEntry, ...myDiaries];
    setMyDiaries(nextMyDiaries);
    saveUserDiariesCache(authUserId, nextMyDiaries);

    setWallDiaries((prev) => [newEntry, ...prev]);

    const nextWritingDays = computeWritingDaysFromDiaries(nextMyDiaries);
    const nextProfile = {...userProfile, writingDays: nextWritingDays};
    setUserProfile(nextProfile);
    saveUserProfileCache(authUserId, nextProfile);

    setSyncError(null);
    setSyncNotice(null);
    void syncUpsertDiaryToSupabase(authUserId, newEntry, nextProfile).then(
      (err) => {
        if (err) {
          setSyncError(`日記發布雲端同步失敗：${err}`);
        } else {
          void syncProfileToSupabase(authUserId, nextProfile);
        }
      },
    );

    setActiveFilter('全部');
    setActiveTab('wall');
    setHighlightedDiaryId(newId);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleUpdateTodaysDiary = ({
    id,
    title,
    content,
    mood,
  }: {
    id: string;
    title: string;
    content: string;
    mood: MoodTag;
  }) => {
    if (!authUserId) return;

    const updatedTimeStr = `今天 ${formatCurrentTime()}`;

    const applyUpdate = (entry: DiaryEntry): DiaryEntry =>
      entry.id === id && isOwnedByActor(entry, authUserId)
        ? {
            ...entry,
            title,
            content,
            mood,
            isEdited: true,
            updatedAt: updatedTimeStr,
          }
        : entry;

    setMyDiaries((prev) => {
      const next = prev.map(applyUpdate);
      saveUserDiariesCache(authUserId, next);
      return next;
    });
    setWallDiaries((prev) => prev.map(applyUpdate));

    setSyncError(null);
    void syncUpdateDiaryToSupabase(authUserId, {
      id,
      title,
      content,
      mood,
    }).then((err) => {
      if (err) {
        setSyncError(`日記修改雲端同步失敗：${err}`);
      }
    });
  };

  const handleJumpToDiary = (diaryId: string) => {
    setActiveFilter('全部');
    setActiveTab('wall');
    setHighlightedDiaryId(diaryId);
  };

  const handleOpenPartnerChat = (partnerId: string) => {
    setActiveTab('connections');
    setActivePartnerId(partnerId);
    setBannerInfo(null);
  };

  const handleSendMessage = (partnerId: string, text: string) => {
    if (!authUserId) return;

    const msgId = `msg-${Date.now()}`;
    const timeStr = formatCurrentTime();

    setUnlockedConnections((prev) => {
      const updated = prev.map((conn) =>
        conn.partnerId === partnerId
          ? {
              ...conn,
              messages: [
                ...conn.messages,
                {id: msgId, sender: 'me' as const, text, timestamp: timeStr},
              ],
            }
          : conn,
      );
      saveUserConnectionsCache(authUserId, updated);
      return updated;
    });

    setSyncError(null);
    void syncMessageToSupabase(authUserId, partnerId, text).then((err) => {
      if (err) {
        setSyncError(`訊息送出失敗：${err}`);
      }
    });
  };

  const handleUpdateProfile = ({
    nickname,
    bio,
  }: {
    nickname: string;
    bio: string;
  }) => {
    if (!authUserId) return;

    const realWritingDays = computeWritingDaysFromDiaries(myDiaries);
    const updatedProfile = {
      ...userProfile,
      nickname,
      bio,
      writingDays: realWritingDays,
    };
    setUserProfile(updatedProfile);
    saveUserProfileCache(authUserId, updatedProfile);

    setMyDiaries((prev) => {
      const next = prev.map((d) =>
        isOwnedByActor(d, authUserId) ? {...d, authorName: nickname} : d,
      );
      saveUserDiariesCache(authUserId, next);
      return next;
    });
    setWallDiaries((prev) =>
      prev.map((d) =>
        isOwnedByActor(d, authUserId) ? {...d, authorName: nickname} : d,
      ),
    );

    void syncProfileToSupabase(authUserId, updatedProfile).then((err) => {
      if (err) setSyncError(err);
    });
  };

  const handleSignIn = async (
    email: string,
    password: string,
  ): Promise<AuthActionResult> => {
    if (!supabase) {
      return {
        error: `尚未設定 Supabase 環境變數（${getSupabaseEnvDiagnostic()}）。`,
      };
    }
    try {
      const {error} = await supabase.auth.signInWithPassword({email, password});
      if (error) {
        return {error: error.message};
      }
      return {error: null};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : '登入連線失敗，請稍後再試。',
      };
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    nickname?: string,
  ): Promise<AuthActionResult> => {
    if (!supabase) {
      return {
        error: `尚未設定 Supabase 環境變數（${getSupabaseEnvDiagnostic()}）。`,
      };
    }
    try {
      const emailFallbackNick = email.split('@')[0]?.trim();
      const cleanNick =
        nickname?.trim() || emailFallbackNick || DEFAULT_EMPTY_PROFILE.nickname;
      const {data, error} = await supabase.auth.signUp({
        email,
        password,
        options: {data: {nickname: cleanNick}},
      });
      if (error) return {error: error.message};

      if (data.user && data.session) {
        await syncProfileToSupabase(data.user.id, {
          ...DEFAULT_EMPTY_PROFILE,
          nickname: cleanNick,
          writingDays: 0,
        });
        return {error: null};
      }

      if (data.user && !data.session) {
        return {
          error: null,
          notice: '註冊成功！請至信箱點擊驗證信完成啟用後再登入。',
        };
      }

      return {error: null};
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : '註冊連線失敗，請稍後再試。',
      };
    }
  };

  const handleSignOut = async () => {
    activeAuthIdRef.current = null;
    setAuthUserId(null);
    setAuthEmail(null);
    resetStateForAccount(null);
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const handleManualSync = async () => {
    if (!authUserId) return;
    await syncFromCloud(authUserId, userProfile.nickname, true, authEmail);
  };

  const clearHighlight = useCallback(() => {
    setHighlightedDiaryId(null);
  }, []);

  const showSafetyFeedback = useCallback((message: string) => {
    setSafetyNotice(message);
    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current);
    }
    safetyTimerRef.current = window.setTimeout(() => {
      setSafetyNotice(null);
    }, 5500);
  }, []);

  const handleRequestReport = (target: SafetyTarget) => {
    if (!authUserId) {
      showSafetyFeedback('請先登入帳號後再進行檢舉。');
      setIsAuthModalOpen(true);
      return;
    }
    setReportTarget(target);
  };

  const handleRequestBlock = (target: SafetyTarget) => {
    if (!authUserId) {
      showSafetyFeedback('請先登入帳號後再進行封鎖。');
      setIsAuthModalOpen(true);
      return;
    }
    setBlockTarget(target);
  };

  const handleSubmitReport = (reason: string, details: string) => {
    if (reportTarget && supabase && authUserId) {
      void supabase
        .from('reports')
        .insert({
          reporter_id: authUserId,
          reported_user_id: reportTarget.targetUserId,
          diary_id: reportTarget.diaryId ?? null,
          reason,
          details: details || null,
        })
        .then(() => {
          // Best-effort persistence if reports table exists
        });
    }
    setReportTarget(null);
    showSafetyFeedback('已收到您的檢舉，我們將儘快處理');
  };

  const handleConfirmBlock = () => {
    if (!blockTarget) return;
    const {targetUserId, targetName} = blockTarget;
    const blockedAt = formatCurrentTime();
    setBlockedUsers((prev) => {
      const exists = prev.some((u) => u.userId === targetUserId);
      const next = exists
        ? prev
        : [...prev, {userId: targetUserId, name: targetName || '匿名筆友', blockedAt}];
      if (authUserId) {
        saveUserBlockedUsersCache(authUserId, next);
      }
      return next;
    });
    if (activePartnerId === targetUserId) {
      setActivePartnerId(null);
    }
    if (bannerInfo?.partnerId === targetUserId) {
      setBannerInfo(null);
    }
    setBlockTarget(null);
    showSafetyFeedback(`已封鎖「${targetName}」，已隱藏其所有日記與對話。`);
  };

  const handleUnblockUser = (userId: string) => {
    const target = blockedUsers.find((u) => u.userId === userId);
    setBlockedUsers((prev) => {
      const next = prev.filter((u) => u.userId !== userId);
      if (authUserId) {
        saveUserBlockedUsersCache(authUserId, next);
      }
      return next;
    });
    showSafetyFeedback(
      `已將「${target?.name || '匿名筆友'}」移出封鎖名單，已恢復顯示其日記與對話。`,
    );
  };

  const blockedSet = new Set(blockedUsers.map((u) => u.userId));
  const visibleWallDiaries = wallDiaries.filter(
    (d) => !blockedSet.has(d.authorId),
  );
  const visiblePendingGlimmers = pendingGlimmers.filter(
    (g) => !blockedSet.has(g.fromAuthorId),
  );
  const visibleConnections = unlockedConnections.filter(
    (c) => !blockedSet.has(c.partnerId),
  );

  const navItems: {
    key: TabKey;
    label: string;
    icon: typeof BookOpen;
    badgeCount?: number;
  }[] = [
    {key: 'wall', label: '日記牆', icon: BookOpen},
    {key: 'write', label: '寫日記', icon: PenLine},
    {
      key: 'connections',
      label: '心意連結',
      icon: HeartHandshake,
      badgeCount: visiblePendingGlimmers.length,
    },
    {key: 'notebook', label: '我的本子', icon: BookMarked},
  ];

  const isPrivacyRoute =
    currentPath === '/privacy' || currentPath === '/privacy/';

  if (isPrivacyRoute) {
    return <PrivacyPolicyPage onBackHome={() => navigateTo('/')} />;
  }

  return (
    <div className="min-h-screen desktop-backdrop">
      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        isSupabaseReady={isSupabaseConfigured}
        onClose={() => setIsAuthModalOpen(false)}
        onNavigateToPrivacy={() => navigateTo('/privacy')}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />

      {/* Safety Report & Block Modals */}
      <SafetyModals
        reportTarget={reportTarget}
        blockTarget={blockTarget}
        onCloseReport={() => setReportTarget(null)}
        onSubmitReport={handleSubmitReport}
        onCloseBlock={() => setBlockTarget(null)}
        onConfirmBlock={handleConfirmBlock}
      />

      {/* Mutual Unlock Notification Banner */}
      <UnlockBanner
        partnerName={bannerInfo?.partnerName ?? null}
        onDismiss={() => setBannerInfo(null)}
        onGoToChat={() => {
          if (bannerInfo) {
            handleOpenPartnerChat(bannerInfo.partnerId);
          }
        }}
      />

      {/* Mobile-First Centered App Shell */}
      <div className="max-w-[480px] mx-auto min-h-screen bg-[#F9F7F2] sm:border-x sm:border-[#E6E1D6] sm:shadow-[0_12px_48px_rgba(44,42,41,0.16)] flex flex-col">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 h-[56px] bg-[#F9F7F2]/95 backdrop-blur-sm border-b border-[#E6E1D6] px-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-[18px] font-semibold text-[#2C2A29] tracking-wide whitespace-nowrap">
              紙間微光
            </h1>
            <span className="text-[11px] text-[#7A756E] tracking-wider whitespace-nowrap">
              Paper Glimmer
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton variant="compact" />
            {authUserId ? (
              <span className="text-xs text-[#7A756E] whitespace-nowrap">
                {userProfile.nickname}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="min-h-[36px] px-2.5 rounded-[8px] text-xs text-[#5C6B54] hover:text-[#2C2A29] hover:bg-[#F3EFE6] font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                登入帳號
              </button>
            )}
          </div>
        </header>

        {/* Visible Sync Error Alert (only shown if a Supabase write/read fails) */}
        {syncError && (
          <div
            role="alert"
            className="bg-[#9E4737]/10 border-b border-[#9E4737]/25 px-4 py-2.5 flex items-start justify-between gap-2 text-xs text-[#9E4737]"
          >
            <span className="leading-relaxed break-all">
              {syncError}（已為您安全保留本機資料）
            </span>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              aria-label="關閉同步錯誤提示"
              className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded hover:bg-[#9E4737]/10 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Safety Report / Block / Login Prompt Notice */}
        {safetyNotice && (
          <div
            role="status"
            className="bg-[#5C6B54]/10 border-b border-[#5C6B54]/25 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-[#2C2A29]"
          >
            <span className="leading-relaxed">{safetyNotice}</span>
            <button
              type="button"
              onClick={() => setSafetyNotice(null)}
              aria-label="關閉提示"
              className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded hover:bg-[#5C6B54]/10 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Main Content */}
        <main className="flex-1 px-4 pb-6">
          {activeTab === 'wall' && (
            <DiaryWall
              diaries={visibleWallDiaries}
              currentUserId={authUserId}
              todayDateStr={todayDateStr}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              pendingGlimmers={visiblePendingGlimmers}
              unlockedConnections={visibleConnections}
              highlightedDiaryId={highlightedDiaryId}
              onClearHighlight={clearHighlight}
              onToggleReaction={handleToggleReaction}
              onOpenPartnerChat={handleOpenPartnerChat}
              onUpdateTodaysDiary={handleUpdateTodaysDiary}
              onGoToWriteOrSignIn={() => {
                if (authUserId) {
                  setActiveTab('write');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              onReportAuthor={handleRequestReport}
              onBlockAuthor={handleRequestBlock}
            />
          )}

          {activeTab === 'write' && (
            <WriteDiary
              isAuthenticated={Boolean(authUserId)}
              todayDateStr={todayDateStr}
              todaysDiary={todaysDiary}
              onPublishDiary={handlePublishDiary}
              onUpdateTodaysDiary={handleUpdateTodaysDiary}
              onGoToSignIn={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'connections' && (
            <ConnectionsTab
              pendingGlimmers={visiblePendingGlimmers}
              unlockedConnections={visibleConnections}
              activePartnerId={activePartnerId}
              onSelectPartner={setActivePartnerId}
              onJumpToDiary={handleJumpToDiary}
              onSendMessage={handleSendMessage}
              onReportPartner={handleRequestReport}
              onBlockPartner={handleRequestBlock}
            />
          )}

          {activeTab === 'notebook' && (
            <MyNotebookTab
              currentUserId={authUserId}
              profile={userProfile}
              myDiaries={myDiaries}
              blockedUsers={blockedUsers}
              isSupabaseReady={isSupabaseConfigured}
              authEmail={authEmail}
              isSyncing={isSyncing}
              syncError={syncError}
              syncNotice={syncNotice}
              onUpdateProfile={handleUpdateProfile}
              onUnblockUser={handleUnblockUser}
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
              onSignOut={handleSignOut}
              onManualSync={handleManualSync}
            />
          )}
        </main>

        {/* Home Footer with Android APK Download, iPhone PWA Guide & Public Privacy Policy Link */}
        <footer className="px-4 pt-4 pb-24 text-center border-t border-[#E6E1D6]/60 space-y-3">
          <div className="space-y-3">
            <AndroidApkDownloadButton variant="footer" />
            <IOSPwaGuide variant="footer" />
          </div>
          <div className="flex items-center justify-center gap-3 text-[11px] text-[#7A756E]">
            <span>紙間微光 Paper Glimmer</span>
            <span aria-hidden="true">·</span>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/privacy');
              }}
              className="text-[#5C6B54] hover:text-[#2C2A29] underline underline-offset-2 font-medium transition-colors"
            >
              隱私權政策
            </a>
          </div>
        </footer>

        {/* Fixed Bottom 4-Tab Navigation Bar */}
        <nav
          aria-label="主導覽列"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 h-[64px] bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E6E1D6] grid grid-cols-4 items-center"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveTab(item.key);
                  if (item.key !== 'connections') {
                    setActivePartnerId(null);
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative h-full min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#9E4737]'
                    : 'text-[#7A756E] hover:text-[#2C2A29]'
                }`}
              >
                <div className="relative">
                  <Icon
                    className="w-[20px] h-[20px]"
                    strokeWidth={isActive ? 2.1 : 1.75}
                  />
                  {typeof item.badgeCount === 'number' &&
                    item.badgeCount > 0 && (
                      <span
                        aria-label={`${item.badgeCount} 位待回應`}
                        className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#9E4737] text-[#FFFDF9] text-[10px] font-medium leading-[16px] text-center tabular-nums"
                      >
                        {item.badgeCount}
                      </span>
                    )}
                </div>
                <span
                  className={`text-[11px] whitespace-nowrap leading-none ${
                    isActive ? 'font-medium' : 'font-normal'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
