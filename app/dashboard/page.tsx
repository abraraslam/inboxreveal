"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { isUserInTrial, trialDaysRemaining } from "@/lib/plans";

type Email = {
  id: string;
  threadId?: string;
  from: string;
  fromEmail?: string;
  subject: string;
  snippet: string;
  body?: string;
  date?: string;
  internalDate?: number;
  provider?: "gmail" | "outlook";
};

type Analysis = {
  intent:
    | "complaint"
    | "refund_request"
    | "cancellation_risk"
    | "sales_opportunity"
    | "urgent"
    | "general";
  priority: "high" | "medium" | "low";
  keywords: string[];
  matchedPhrases: string[];
  reason: string;
  summary: string;
  recommendedAction?: string;
  shouldAlert?: boolean;
  alertReason?: string;
};

type GmailResponse = {
  emails: Email[];
  nextPageToken?: string | null;
  totalReturned?: number;
  error?: string;
  message?: string;
  details?: string | null;
};

type SavedAnalysisResponse = {
  analysis: Record<string, Analysis>;
  totalReturned?: number;
};

type ReplyMode = "positive" | "neutral" | "negative";

type DashboardFilter =
  | "all"
  | "alerted"
  | "high_priority"
  | "complaint"
  | "sales_opportunity"
  | "keyword_hits";

type Notice = {
  type: "success" | "error";
  message: string;
};

type ReviewAction =
  | "general"
  | "professional"
  | "shorter"
  | "polite"
  | "persuasive";

type DraftReviewResponse = {
  improvedSubject?: string;
  improvedBody?: string;
  suggestions?: string[];
};

type PlanTier = "basic" | "premium" | "gold";

type UserPreferences = {
  keywords?: string[];
  alert_urgent?: boolean;
  alert_complaint?: boolean;
  alert_sales?: boolean;
  hide_preferences_prompt?: boolean;
  plan_tier?: PlanTier;
  updated_at?: string;
  trial_end_at?: string;
};

type SavePreferencesResponse = {
  success?: boolean;
  error?: string;
};

function extractEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();

  const plainEmailMatch = value.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );
  return plainEmailMatch?.[0] || value.trim();
}

function buildReplySubject(subject?: string) {
  const clean = (subject || "").trim();
  if (!clean) return "Re: No subject";
  return /^re:/i.test(clean) ? clean : `Re: ${clean}`;
}

function buildForwardSubject(subject?: string) {
  const clean = (subject || "").trim();
  if (!clean) return "Fwd: No subject";
  return /^fwd?:/i.test(clean) ? clean : `Fwd: ${clean}`;
}

function buildForwardBody(email: Email) {
  const forwardedContent = (email.body || email.snippet || "").trim();
  const safeSubject = (email.subject || "No subject").trim() || "No subject";

  return `\n\n---------- Forwarded message ---------\nFrom: ${email.from || "Unknown sender"}\nDate: ${email.date || "Unknown date"}\nSubject: ${safeSubject}\n\n${forwardedContent}`;
}

export default function Home() {
  const { data: session } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [emails, setEmails] = useState<Email[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [sendId, setSendId] = useState<string | null>(null);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  const [replies, setReplies] = useState<Record<string, string>>({});
  const [replyModeByEmail, setReplyModeByEmail] = useState<
    Record<string, ReplyMode>
  >({});
  const [analysis, setAnalysis] = useState<Record<string, Analysis>>({});
  const [analyzingIds, setAnalyzingIds] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeAutoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [keywordInput, setKeywordInput] = useState("refund,cancel,pricing");
  const [alertUrgent, setAlertUrgent] = useState(true);
  const [alertComplaint, setAlertComplaint] = useState(true);
  const [alertSales, setAlertSales] = useState(true);
  const [planTier, setPlanTier] = useState<PlanTier>("basic");
  const [trialEndAt, setTrialEndAt] = useState<string | null>(null);

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<
    Array<{ name: string; type: string; data: string }>
  >([]);
  const [composeReviewLoading, setComposeReviewLoading] = useState(false);
  const [composeSaving, setComposeSaving] = useState(false);
  const [composeSending, setComposeSending] = useState(false);
  const [composeReview, setComposeReview] = useState<DraftReviewResponse | null>(
    null
  );
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isComposeMinimized, setIsComposeMinimized] = useState(false);

  const composeFileInputRef = useRef<HTMLInputElement | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isPreferencesMinimized, setIsPreferencesMinimized] = useState(false);
  const prefAutoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPreferenceSetupRequired, setIsPreferenceSetupRequired] =
    useState(false);
  const [dontShowPreferencesNextTime, setDontShowPreferencesNextTime] =
    useState(false);
  const [showSetupPreferencesWidget, setShowSetupPreferencesWidget] =
    useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesUpdatedAt, setPreferencesUpdatedAt] = useState<
    string | null
  >(null);

  const [reviewingReplyId, setReviewingReplyId] = useState<string | null>(null);
  const [replyReviews, setReplyReviews] = useState<
    Record<string, DraftReviewResponse>
  >({});
  const [activeReplyEmailId, setActiveReplyEmailId] = useState<string | null>(
    null
  );
  const [isReplyModalMaximized, setIsReplyModalMaximized] = useState(false);
  const [replySubjects, setReplySubjects] = useState<Record<string, string>>({});
  const [replyCCs, setReplyCCs] = useState<Record<string, string>>({});
  const [replyAttachments, setReplyAttachments] = useState<
    Record<string, Array<{ name: string; type: string; data: string }>>
  >({});

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve((reader.result as string).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const activeReplyEmail = useMemo(() => {
    if (!activeReplyEmailId) return null;
    return emails.find((email) => email.id === activeReplyEmailId) || null;
  }, [emails, activeReplyEmailId]);

  const activeReplyReview = useMemo(() => {
    if (!activeReplyEmailId) return null;
    return replyReviews[activeReplyEmailId] || null;
  }, [activeReplyEmailId, replyReviews]);

  useEffect(() => {
    if (!activeReplyEmailId) return;

    if (!replies[activeReplyEmailId]) {
      setActiveReplyEmailId(null);
    }
  }, [activeReplyEmailId, replies]);

  useEffect(() => {
    if (!activeReplyEmailId) {
      setIsReplyModalMaximized(false);
    }
  }, [activeReplyEmailId]);

  useEffect(() => {
    if (!notice) {
      if (noticeAutoHideTimerRef.current) {
        clearTimeout(noticeAutoHideTimerRef.current);
        noticeAutoHideTimerRef.current = null;
      }
      return;
    }

    if (noticeAutoHideTimerRef.current) {
      clearTimeout(noticeAutoHideTimerRef.current);
    }

    noticeAutoHideTimerRef.current = setTimeout(() => {
      setNotice(null);
      noticeAutoHideTimerRef.current = null;
    }, 15000);

    return () => {
      if (noticeAutoHideTimerRef.current) {
        clearTimeout(noticeAutoHideTimerRef.current);
        noticeAutoHideTimerRef.current = null;
      }
    };
  }, [notice]);

  const customKeywords = useMemo(
    () =>
      keywordInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    [keywordInput]
  );

  const preferenceChecklist = useMemo(() => {
    const smartAlertsConfigured =
      planTier === "basic" || alertUrgent || alertComplaint || alertSales;

    return [
      {
        label: "Plan selected",
        done: ["basic", "premium", "gold"].includes(planTier),
      },
      {
        label: "Keywords configured",
        done: customKeywords.length > 0,
      },
      {
        label: "Alert categories configured",
        done: smartAlertsConfigured,
      },
      {
        label: "Prompt visibility preference set",
        done: typeof dontShowPreferencesNextTime === "boolean",
      },
      {
        label: "Preferences saved",
        done: Boolean(preferencesUpdatedAt),
      },
    ];
  }, [
    alertComplaint,
    alertSales,
    alertUrgent,
    customKeywords.length,
    dontShowPreferencesNextTime,
    planTier,
    preferencesUpdatedAt,
  ]);

  const completedPreferenceSteps = preferenceChecklist.filter(
    (item) => item.done
  ).length;

  const preferenceProgressPercent = Math.round(
    (completedPreferenceSteps / preferenceChecklist.length) * 100
  );

  const isInTrial = isUserInTrial(trialEndAt);
  const trialDaysLeft = trialDaysRemaining(trialEndAt);
  const showTrialBanner = isInTrial && planTier === "basic";

  const planCapabilities = useMemo(() => {
    // During an active trial every user gets Gold-level access.
    if (isInTrial) {
      return {
        canUseSummaries: true,
        canUseSuggestedReplies: true,
        canUseSmartAlerts: true,
        canUseAiDraftReview: true,
      };
    }

    if (planTier === "gold") {
      return {
        canUseSummaries: true,
        canUseSuggestedReplies: true,
        canUseSmartAlerts: true,
        canUseAiDraftReview: true,
      };
    }

    if (planTier === "premium") {
      return {
        canUseSummaries: true,
        canUseSuggestedReplies: true,
        canUseSmartAlerts: true,
        canUseAiDraftReview: false,
      };
    }

    return {
      canUseSummaries: false,
      canUseSuggestedReplies: false,
      canUseSmartAlerts: false,
      canUseAiDraftReview: false,
    };
  }, [planTier, isInTrial]);

  // DEBUG: Show plan tier and capabilities in UI
  const debugPanel = (
    <div style={{ background: '#f5f5f5', color: '#222', padding: 8, margin: 8, border: '1px solid #ccc', borderRadius: 4 }}>
      <strong>DEBUG:</strong> planTier = <b>{planTier}</b>, isInTrial = <b>{String(isInTrial)}</b><br />
      planCapabilities: <pre style={{ display: 'inline', margin: 0 }}>{JSON.stringify(planCapabilities, null, 2)}</pre>
    </div>
  );

  const showUpgradeNotice = (feature: string, requiredPlan: "premium" | "gold") => {
    setNotice({
      type: "error",
      message: `${feature} is available on ${requiredPlan === "premium" ? "Premium or Gold" : "Gold"} plan.`,
    });
  };

  const getPreferencePromptStorageKey = (email: string) =>
    `hide-preferences-prompt:${email.toLowerCase()}`;

  const shouldShowEmail = (item?: Analysis) => {
    if (!item) return true;

    if (item.intent === "urgent" && alertUrgent) return true;
    if (item.intent === "complaint" && alertComplaint) return true;
    if (item.intent === "sales_opportunity" && alertSales) return true;

    if (
      item.intent !== "urgent" &&
      item.intent !== "complaint" &&
      item.intent !== "sales_opportunity"
    ) {
      return true;
    }

    return false;
  };

  const matchesDashboardFilter = (item: Analysis | undefined) => {
    switch (activeFilter) {
      case "alerted":
        return item?.shouldAlert === true;
      case "high_priority":
        return item?.priority === "high";
      case "complaint":
        return item?.intent === "complaint";
      case "sales_opportunity":
        return item?.intent === "sales_opportunity";
      case "keyword_hits":
        return (item?.keywords || []).length > 0;
      case "all":
      default:
        return true;
    }
  };

  const mergeSavedAnalysis = (saved: Record<string, Analysis>) => {
    if (!saved || Object.keys(saved).length === 0) return;

    setAnalysis((prev) => ({
      ...prev,
      ...saved,
    }));
  };

  const loadSavedAnalysis = async (emailList: Email[]) => {
    if (emailList.length === 0) {
      return {} as Record<string, Analysis>;
    }

    try {
      const ids = emailList.map((email) => email.id).join(",");
      const res = await fetch(`/api/get-analysis?ids=${encodeURIComponent(ids)}`);
      const data: SavedAnalysisResponse & { error?: string } = await res.json();

      if (!res.ok) {
        console.warn(
          "Saved analysis unavailable:",
          data.error || "Failed to load saved analysis"
        );
        return {} as Record<string, Analysis>;
      }

      const savedAnalysis = data.analysis || {};
      mergeSavedAnalysis(savedAnalysis);
      return savedAnalysis;
    } catch (error) {
      console.error("Failed to load saved analysis:", error);
      return {} as Record<string, Analysis>;
    }
  };

  const getEmailLoadErrorMessage = (data: GmailResponse | Email[]) => {
    if (Array.isArray(data)) {
      return "Failed to load emails.";
    }

    if (data.message) {
      return data.message;
    }

    if (data.error) {
      return data.error;
    }

    return "Failed to load emails.";
  };

  const analyzeEmails = async (
    data: Email[],
    keywordsToUse: string[] = customKeywords
  ) => {
    if (!data.length) return;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });

    const analyzeOne = async (
      email: Email,
      attempt = 0
    ): Promise<Analysis | null> => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: email.id,
          text: email.body || email.snippet,
          subject: email.subject,
          from: email.from,
          customKeywords: keywordsToUse,
        }),
      });

      const result: Analysis & { error?: string } = await res.json();

      if (res.status === 429 && attempt < 2) {
        const retryAfterSeconds = Number(res.headers.get("Retry-After") || "0");
        const waitMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 1200;
        await wait(waitMs);
        return analyzeOne(email, attempt + 1);
      }

      if (!res.ok) {
        throw new Error(result.error || "Failed to analyze email");
      }

      return result;
    };

    try {
      setAnalyzing(true);

      const batchSize = 3;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (email) => {
            try {
              setAnalyzingIds((prev) => ({
                ...prev,
                [email.id]: true,
              }));

              const result = await analyzeOne(email);

              if (!result) {
                return;
              }

              setAnalysis((prev) => ({
                ...prev,
                [email.id]: result,
              }));
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to analyze email";

              if (/too many analysis requests/i.test(message)) {
                console.warn("Analyze hit rate limit for email:", email.id);
              } else {
                console.error("Analyze failed for email:", email.id, error);
              }
            } finally {
              setAnalyzingIds((prev) => {
                const next = { ...prev };
                delete next[email.id];
                return next;
              });
            }
          })
        );

        if (i + batchSize < data.length) {
          await wait(300);
        }
      }
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.email) return;

    const localStorageKey = getPreferencePromptStorageKey(session.user.email);
    const localHidePrompt =
      localStorage.getItem(localStorageKey) === "true";

    fetch(`/api/preferences?email=${encodeURIComponent(session.user.email)}`)
      .then((res) => res.json())
      .then((data: UserPreferences | null) => {
        const hidePrompt =
          data?.hide_preferences_prompt === true || localHidePrompt;

        setDontShowPreferencesNextTime(hidePrompt);

        if (!data) {
          setPreferencesUpdatedAt(null);
          if (hidePrompt) {
            setIsPreferenceSetupRequired(false);
            setIsPreferencesOpen(false);
            setIsPreferencesMinimized(false);
          } else {
            setIsPreferenceSetupRequired(true);
            setIsPreferencesOpen(true);
            setIsPreferencesMinimized(false);
          }
          return;
        }

        const incomingPlan: PlanTier =
          data.plan_tier === "premium" || data.plan_tier === "gold"
            ? data.plan_tier
            : "basic";

        setPlanTier(incomingPlan);
        // Fix: Use correct property for trial end date if available, else set to null
        setTrialEndAt((data as any).trial_end_at ?? null);
        setKeywordInput((data.keywords || []).join(","));
        setAlertUrgent(incomingPlan === "basic" ? false : (data.alert_urgent ?? true));
        setAlertComplaint(
          incomingPlan === "basic" ? false : (data.alert_complaint ?? true)
        );
        setAlertSales(incomingPlan === "basic" ? false : (data.alert_sales ?? true));
        setPreferencesUpdatedAt(data.updated_at || null);
        setIsPreferenceSetupRequired(false);

        if (!hidePrompt) {
          setIsPreferencesOpen(true);
          setIsPreferencesMinimized(false);
          // Auto-hide the panel after 10 seconds on login.
          if (prefAutoHideTimerRef.current) clearTimeout(prefAutoHideTimerRef.current);
          prefAutoHideTimerRef.current = setTimeout(() => {
            setIsPreferencesOpen(false);
            prefAutoHideTimerRef.current = null;
          }, 10000);
        }
      })
      .catch((error) => {
        console.error("Failed to load preferences:", error);
      });
  }, [session]);

  useEffect(() => {
    if (!session?.user?.email) {
      setShowSetupPreferencesWidget(false);
      return;
    }

    setShowSetupPreferencesWidget(true);
    const timer = setTimeout(() => {
      setShowSetupPreferencesWidget(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [session?.user?.email]);

  useEffect(() => {
    if (planTier === "basic") {
      setAlertUrgent(false);
      setAlertComplaint(false);
      setAlertSales(false);
    }
  }, [planTier]);

  const savePreferences = async () => {
    // User is actively interacting — cancel any pending auto-hide.
    if (prefAutoHideTimerRef.current) {
      clearTimeout(prefAutoHideTimerRef.current);
      prefAutoHideTimerRef.current = null;
    }
    if (!session?.user?.email) {
      setNotice({
        type: "error",
        message: "Sign in again to save preferences.",
      });
      return false;
    }

    try {
      setNotice(null);
      setSavingPreferences(true);

      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          keywords: customKeywords,
          alertUrgent: planCapabilities.canUseSmartAlerts ? alertUrgent : false,
          alertComplaint: planCapabilities.canUseSmartAlerts ? alertComplaint : false,
          alertSales: planCapabilities.canUseSmartAlerts ? alertSales : false,
          planTier,
          hidePreferencesPrompt: dontShowPreferencesNextTime,
        }),
      });

      const payload: SavePreferencesResponse = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || "Failed to save preferences");
      }

      localStorage.setItem(
        getPreferencePromptStorageKey(session.user.email),
        String(dontShowPreferencesNextTime)
      );

      setPreferencesUpdatedAt(new Date().toISOString());

      setNotice({
        type: "success",
        message: "Preferences saved successfully.",
      });

      if (isPreferenceSetupRequired) {
        setIsPreferenceSetupRequired(false);
        setIsPreferencesOpen(false);
        setIsPreferencesMinimized(false);
      }

      return true;
    } catch (error: unknown) {
      try {
        const verifyRes = await fetch("/api/preferences");
        const verifyData: UserPreferences | null = await verifyRes.json();

        const verifiedPlan: PlanTier =
          verifyData?.plan_tier === "premium" || verifyData?.plan_tier === "gold"
            ? verifyData.plan_tier
            : "basic";

        if (verifyRes.ok && verifyData && verifiedPlan === planTier) {
          setPreferencesUpdatedAt(verifyData.updated_at || new Date().toISOString());
          setNotice({
            type: "success",
            message: "Preferences saved successfully.",
          });

          if (isPreferenceSetupRequired) {
            setIsPreferenceSetupRequired(false);
            setIsPreferencesOpen(false);
            setIsPreferencesMinimized(false);
          }

          return true;
        }
      } catch {
        // Ignore verification errors and show original failure below.
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to save preferences.";

      setNotice({
        type: "error",
        message,
      });
      return false;
    } finally {
      setSavingPreferences(false);
    }
  };

  useEffect(() => {
    if (!session) return;

    const loadEmails = async () => {
      try {
        setLoadingEmails(true);
        setNotice(null);

        const res = await fetch("/api/emails");
        const data: GmailResponse | Email[] = await res.json();

        if (!res.ok) {
          const errorMessage = getEmailLoadErrorMessage(data);

          setEmails([]);
          setNextPageToken(null);
          setNotice({
            type: "error",
            message: errorMessage,
          });

          return;
        }

        const emailList = Array.isArray(data)
          ? data
          : Array.isArray(data.emails)
          ? data.emails
          : [];

        const sortedEmails = [...emailList].sort(
          (a, b) => (b.internalDate || 0) - (a.internalDate || 0)
        );

        setEmails(sortedEmails);
        setNextPageToken(Array.isArray(data) ? null : data.nextPageToken || null);
        setAnalysis({});
        setReplies({});
        setReplyModeByEmail({});
        setExpandedEmailId(null);
        setActiveFilter("all");
        setReplyReviews({});
        setActiveReplyEmailId(null);

        const initialEmails = sortedEmails.slice(0, 15);
        const savedAnalysis = await loadSavedAnalysis(initialEmails);

        const missingEmails = initialEmails.filter(
          (email) => !savedAnalysis[email.id]
        );

        await analyzeEmails(missingEmails, customKeywords);
      } catch (error) {
        console.error("Failed to fetch emails:", error);
        setEmails([]);
        setNextPageToken(null);
        setNotice({
          type: "error",
          message:
            error instanceof Error && error.message
              ? error.message
              : "Failed to load emails.",
        });
      } finally {
        setLoadingEmails(false);
      }
    };

    loadEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadMoreEmails = async () => {
    if (!nextPageToken) return;

    try {
      setLoadingMore(true);
      setNotice(null);

      const res = await fetch(
        `/api/emails?pageToken=${encodeURIComponent(nextPageToken)}`
      );
      const data: GmailResponse = await res.json();

      if (!res.ok) {
        throw new Error("Failed to load more emails");
      }

      const moreEmails = Array.isArray(data.emails) ? data.emails : [];

      setEmails((prev) => {
        const merged = [...prev, ...moreEmails];
        const unique = merged.filter(
          (email, index, arr) =>
            index === arr.findIndex((item) => item.id === email.id)
        );

        return unique.sort(
          (a, b) => (b.internalDate || 0) - (a.internalDate || 0)
        );
      });

      setNextPageToken(data.nextPageToken || null);

      const batchToProcess = moreEmails.slice(0, 10);
      const savedAnalysis = await loadSavedAnalysis(batchToProcess);
      const missingEmails = batchToProcess.filter(
        (email) => !savedAnalysis[email.id]
      );

      await analyzeEmails(missingEmails, customKeywords);
    } catch (error) {
      console.error("Failed to load more emails:", error);
      setNotice({
        type: "error",
        message: "Failed to load more emails.",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const rerunAnalysis = async () => {
    if (!emails.length) return;

    const emailsToRefresh = emails;
    const clearedIds = new Set(emailsToRefresh.map((email) => email.id));

    setNotice(null);

    setAnalysis((prev) => {
      const next = { ...prev };

      for (const id of clearedIds) {
        delete next[id];
      }

      return next;
    });

    await analyzeEmails(emailsToRefresh, customKeywords);

    setNotice({
      type: "success",
      message: "Analysis refreshed.",
    });
  };

  const generateReply = async (email: Email, mode: ReplyMode) => {
    if (!planCapabilities.canUseSuggestedReplies) {
      showUpgradeNotice("Suggested replies", "premium");
      return;
    }

    try {
      setReplyId(email.id);
      setNotice(null);
      setReplyModeByEmail((prev) => ({
        ...prev,
        [email.id]: mode,
      }));

      const res = await fetch("/api/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: email.subject,
          text: email.body || email.snippet,
          replyMode: mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: data.error || `Failed to generate ${mode} reply.`,
        });
        return;
      }

      setReplies((prev) => ({
        ...prev,
        [email.id]: data.reply,
      }));

      setReplyReviews((prev) => {
        const next = { ...prev };
        delete next[email.id];
        return next;
      });

      setNotice({
        type: "success",
        message: `${mode.charAt(0).toUpperCase() + mode.slice(1)} reply generated.`,
      });
      setActiveReplyEmailId(email.id);
    } catch {
      setNotice({
        type: "error",
        message: "Something went wrong while generating reply.",
      });
    } finally {
      setReplyId(null);
    }
  };

  const discardReply = (emailId: string) => {
    setReplies((prev) => {
      const next = { ...prev };
      delete next[emailId];
      return next;
    });

    setReplyModeByEmail((prev) => {
      const next = { ...prev };
      delete next[emailId];
      return next;
    });

    setReplyReviews((prev) => {
      const next = { ...prev };
      delete next[emailId];
      return next;
    });

    setReplySubjects((prev) => {
      const next = { ...prev };
      delete next[emailId];
      return next;
    });

    setReplyCCs((prev) => {
      const next = { ...prev };
      delete next[emailId];
      return next;
    });

    setReplyAttachments((prev) => {
      const next = { ...prev };
      delete next[emailId];
      return next;
    });

    if (activeReplyEmailId === emailId) {
      setActiveReplyEmailId(null);
    }

    setNotice({
      type: "success",
      message: "Reply discarded.",
    });
  };

  const closeCompose = () => {
    setIsComposeOpen(false);
    setIsComposeMinimized(false);
  };

  const discardCompose = () => {
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setComposeCc("");
    setComposeAttachments([]);
    setComposeReview(null);
    setIsComposeOpen(false);
    setIsComposeMinimized(false);

    setNotice({
      type: "success",
      message: "Compose draft discarded.",
    });
  };

  const openForwardDraft = (email: Email) => {
    setComposeTo("");
    setComposeSubject(buildForwardSubject(email.subject));
    setComposeBody(buildForwardBody(email));
    setComposeReview(null);
    setIsComposeOpen(true);
    setIsComposeMinimized(false);

    setNotice({
      type: "success",
      message: "Forward draft opened in compose.",
    });
  };

  const reviewComposeDraft = async (action: ReviewAction = "general") => {
    if (!planCapabilities.canUseAiDraftReview) {
      showUpgradeNotice("AI draft review", "gold");
      return;
    }

    if (!composeBody.trim()) {
      setNotice({
        type: "error",
        message: "Write your email draft first before AI review.",
      });
      return;
    }

    try {
      setComposeReviewLoading(true);
      setNotice(null);

      const res = await fetch("/api/review-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
          action,
        }),
      });

      const data: DraftReviewResponse & { error?: string } = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: data.error || "Failed to review draft.",
        });
        return;
      }

      setComposeReview(data);
      setComposeSubject(data.improvedSubject || composeSubject);
      setComposeBody(data.improvedBody || composeBody);

      setNotice({
        type: "success",
        message: "AI review completed and applied to your compose draft.",
      });
    } catch {
      setNotice({
        type: "error",
        message: "Something went wrong while reviewing the draft.",
      });
    } finally {
      setComposeReviewLoading(false);
    }
  };

  const saveComposeDraft = async () => {
    if (!composeTo.trim() || !composeBody.trim()) {
      setNotice({
        type: "error",
        message: "Recipient and message body are required.",
      });
      return;
    }

    try {
      setComposeSaving(true);
      setNotice(null);

      const res = await fetch("/api/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim() || "No subject",
          body: composeBody,
          cc: composeCc.trim() || undefined,
          attachments: composeAttachments.length ? composeAttachments : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: data.error || "Failed to save draft.",
        });
        return;
      }

      setNotice({
        type: "success",
        message: "New email draft saved.",
      });

      setIsComposeOpen(false);
      setIsComposeMinimized(false);
    } catch {
      setNotice({
        type: "error",
        message: "Something went wrong while saving draft.",
      });
    } finally {
      setComposeSaving(false);
    }
  };

  const sendComposeEmail = async () => {
    if (!composeTo.trim() || !composeBody.trim()) {
      setNotice({
        type: "error",
        message: "Recipient and message body are required.",
      });
      return;
    }

    try {
      setComposeSending(true);
      setNotice(null);

      const res = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim() || "No subject",
          body: composeBody,
          cc: composeCc.trim() || undefined,
          attachments: composeAttachments.length ? composeAttachments : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: data.error || "Failed to send email.",
        });
        return;
      }

      setNotice({
        type: "success",
        message: "New email sent.",
      });

      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeCc("");
      setComposeAttachments([]);
      setComposeReview(null);
      setIsComposeOpen(false);
      setIsComposeMinimized(false);
    } catch {
      setNotice({
        type: "error",
        message: "Something went wrong while sending email.",
      });
    } finally {
      setComposeSending(false);
    }
  };

  const reviewReplyDraft = async (
    email: Email,
    action: ReviewAction = "general"
  ) => {
    if (!planCapabilities.canUseAiDraftReview) {
      showUpgradeNotice("AI draft review", "gold");
      return;
    }

    const currentReply = replies[email.id];

    if (!currentReply?.trim()) {
      setNotice({
        type: "error",
        message: "Generate or write a reply first before AI review.",
      });
      return;
    }

    try {
      setReviewingReplyId(email.id);
      setNotice(null);

      const res = await fetch("/api/review-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email.fromEmail || extractEmailAddress(email.from),
          subject: buildReplySubject(email.subject),
          body: currentReply,
          action,
        }),
      });

      const data: DraftReviewResponse & { error?: string } = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: data.error || "Failed to review reply draft.",
        });
        return;
      }

      setReplies((prev) => ({
        ...prev,
        [email.id]: data.improvedBody || prev[email.id],
      }));

      setNotice({
        type: "success",
        message: "Reply updated.",
      });
    } catch {
      setNotice({
        type: "error",
        message: "Something went wrong while reviewing reply draft.",
      });
    } finally {
      setReviewingReplyId(null);
    }
  };

  const intentLabel = (intent?: Analysis["intent"]) => {
    switch (intent) {
      case "refund_request":
        return "Refund Request";
      case "cancellation_risk":
        return "Cancellation Risk";
      case "sales_opportunity":
        return "Sales Opportunity";
      case "complaint":
        return "Complaint";
      case "urgent":
        return "Urgent";
      default:
        return "General";
    }
  };

  const replyModeLabel = (mode?: ReplyMode) => {
    switch (mode) {
      case "positive":
        return "Positive Reply";
      case "neutral":
        return "Neutral Reply";
      case "negative":
        return "Negative Reply";
      default:
        return "Reply";
    }
  };

  const filterLabel = (filter: DashboardFilter) => {
    switch (filter) {
      case "alerted":
        return "Alerted Emails";
      case "high_priority":
        return "High Priority";
      case "complaint":
        return "Complaints";
      case "sales_opportunity":
        return "Sales Opportunities";
      case "keyword_hits":
        return "Keyword Hits";
      default:
        return "All Emails";
    }
  };

  const alertedCount = Object.values(analysis).filter(
    (item) => item.shouldAlert === true
  ).length;

  const highPriorityCount = Object.values(analysis).filter(
    (item) => item.priority === "high"
  ).length;

  const complaintCount = Object.values(analysis).filter(
    (item) => item.intent === "complaint"
  ).length;

  const salesCount = Object.values(analysis).filter(
    (item) => item.intent === "sales_opportunity"
  ).length;

  const keywordHitsCount = Object.values(analysis).filter(
    (item) => (item.keywords || []).length > 0
  ).length;

  const filteredEmails = emails.filter((email) => {
    const item = analysis[email.id];
    return shouldShowEmail(item) && matchesDashboardFilter(item);
  });

  const statCardClass = (filter: DashboardFilter) =>
    `rounded-2xl border p-4 text-left transition-all duration-200 shadow-sm cursor-pointer ${
      activeFilter === filter
        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-200 shadow-md"
        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
    }`;

  const buttonBase =
    "inline-flex w-full sm:w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

  const primaryButton = `${buttonBase} bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg`;
  const secondaryButton = `${buttonBase} border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400`;
  const successButton = `${buttonBase} bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg`;
  const warningButton = `${buttonBase} bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600 hover:shadow-lg`;
  const dangerButton = `${buttonBase} bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md hover:from-rose-600 hover:to-red-600 hover:shadow-lg`;
  const ghostButton =
    "inline-flex w-full sm:w-auto items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition";
  const upgradeLinkClass =
    "inline-flex w-full sm:w-auto items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100";

  const planBadgeClass =
    planTier === "gold"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : planTier === "premium"
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : "border-slate-300 bg-slate-100 text-slate-700";

  const planBadgeLabel =
    planTier === "gold"
      ? "Gold"
      : planTier === "premium"
      ? "Premium"
      : "Free";

  const priorityBadgeClass = (priority?: Analysis["priority"]) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50 text-red-700";
      case "medium":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "low":
      default:
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
  };

  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <BrandLogo size="lg" showText={false} className="mb-4 justify-center" />
              <div className="mb-4 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                InboxReveal
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
              <p className="mt-3 text-sm text-slate-400">
                AI-powered email intelligence to prioritize, analyze, and respond faster
              </p>
            </div>
            <button
              onClick={async () => {
                setIsSigningIn(true);
                await signIn("google", { callbackUrl: "/dashboard" });
                setIsSigningIn(false);
              }}
              disabled={isSigningIn}
              className="w-full inline-flex items-center justify-center rounded-xl px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isSigningIn ? "Redirecting..." : "Sign in with Google Workspace"}
            </button>
            <p className="mt-4 text-center text-xs text-slate-500">
              Secure sign-in powered by NextAuth
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {debugPanel}
      <div className="mx-auto max-w-screen-2xl p-4 sm:p-6 2xl:p-8">
        {/* Free Trial Banner */}
        {showTrialBanner && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              <p className="text-sm font-semibold text-amber-800">
                Free Trial — {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} remaining. You have full Gold access to all features.
              </p>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 transition"
            >
              View Plans
            </Link>
          </div>
        )}
        {/* Header Section */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-blue-700">Smart Inbox Dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <BrandLogo showText={false} iconClassName="rounded-xl" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    InboxReveal
                    <span className={`ml-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold align-middle ${planBadgeClass}`}>
                      {planBadgeLabel} Plan
                    </span>
                  </h1>
                  <p className="text-sm text-slate-600">AI-powered email prioritization and intelligent replies</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {planTier !== "gold" && (
                <Link href="/pricing?from=dashboard-header" className={upgradeLinkClass}>
                  Upgrade Plan
                </Link>
              )}

              {planTier !== "basic" && (
                <Link href="/api/stripe/portal" className={upgradeLinkClass}>
                  Manage Billing
                </Link>
              )}

              <button
                className={primaryButton}
                type="button"
                onClick={() => {
                  setIsComposeOpen(true);
                  setIsComposeMinimized(false);
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Compose Email
              </button>

              <button
                className={secondaryButton}
                onClick={rerunAnalysis}
                type="button"
                disabled={analyzing || loadingEmails}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M 4 5 l 4 0 l 0 4 l -4 0 l 0 -4 M 4 13 l 4 0 l 0 4 l -4 0 l 0 -4 M 12 5 l 4 0 l 0 4 l -4 0 l 0 -4 M 12 13 l 4 0 l 0 4 l -4 0 l 0 -4" />
                </svg>
                {analyzing ? "Analyzing..." : "Re-run analysis"}
              </button>

              <button
                className={secondaryButton}
                onClick={() => {
                  setIsPreferencesOpen(true);
                  setIsPreferencesMinimized(false);
                }}
                type="button"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Preferences
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={ghostButton}
                type="button"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {notice && (
          <div className="fixed inset-x-4 top-4 z-40 w-auto sm:inset-x-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-md toast-enter">
            <div
              className={`rounded-xl border p-4 shadow-2xl backdrop-blur flex items-start justify-between gap-4 ${
                notice.type === "success"
                  ? "border-emerald-300 bg-emerald-50/95 text-emerald-900"
                  : "border-rose-300 bg-rose-50/95 text-rose-900"
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                {notice.type === "success" ? (
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">
                    {notice.type === "success" ? "Summary" : "Error"}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{notice.message}</p>
                </div>
              </div>
              <button
                type="button"
                className="flex-shrink-0 rounded-lg p-1 hover:bg-white/30 transition"
                onClick={() => setNotice(null)}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <button
            type="button"
            className={`${statCardClass("all")} flex flex-col justify-between h-full`}
            onClick={() => setActiveFilter("all")}
          >
            <div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">All Emails</p>
            </div>
            <div>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {emails.length}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {activeFilter === "all" ? "Currently selected" : "Click to view"}
              </p>
            </div>
          </button>

          <button
            type="button"
            className={`${statCardClass("alerted")} flex flex-col justify-between h-full`}
            onClick={() => setActiveFilter("alerted")}
          >
            <div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 mb-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Alerted</p>
            </div>
            <div>
              <p className="mt-4 text-3xl font-bold text-orange-600">
                {alertedCount}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {activeFilter === "alerted" ? "Currently selected" : "Needs review"}
              </p>
            </div>
          </button>

          <button
            type="button"
            className={`${statCardClass("high_priority")} flex flex-col justify-between h-full`}
            onClick={() => setActiveFilter("high_priority")}
          >
            <div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 mb-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">High Priority</p>
            </div>
            <div>
              <p className="mt-4 text-3xl font-bold text-red-600">
                {highPriorityCount}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {activeFilter === "high_priority" ? "Currently selected" : "Act soon"}
              </p>
            </div>
          </button>

          <button
            type="button"
            className={`${statCardClass("complaint")} flex flex-col justify-between h-full`}
            onClick={() => setActiveFilter("complaint")}
          >
            <div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 text-rose-600 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0a9 9 0 090-18 9 9 0 090 18z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Complaints</p>
            </div>
            <div>
              <p className="mt-4 text-3xl font-bold text-rose-600">
                {complaintCount}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {activeFilter === "complaint" ? "Currently selected" : "Need response"}
              </p>
            </div>
          </button>

          <button
            type="button"
            className={`${statCardClass("sales_opportunity")} flex flex-col justify-between h-full`}
            onClick={() => setActiveFilter("sales_opportunity")}
          >
            <div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Sales Ops</p>
            </div>
            <div>
              <p className="mt-4 text-3xl font-bold text-emerald-600">
                {salesCount}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {activeFilter === "sales_opportunity" ? "Currently selected" : "Take action"}
              </p>
            </div>
          </button>

          <button
            type="button"
            className={`${statCardClass("keyword_hits")} flex flex-col justify-between h-full`}
            onClick={() => setActiveFilter("keyword_hits")}
          >
            <div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Keywords</p>
            </div>
            <div>
              <p className="mt-4 text-3xl font-bold text-indigo-600">
                {keywordHitsCount}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {activeFilter === "keyword_hits" ? "Currently selected" : "Matched"}
              </p>
            </div>
          </button>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-600">
              Showing:
            </p>
            <span className="font-semibold text-slate-900 inline-flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              {filterLabel(activeFilter)}
            </span>
            <span className="text-slate-400 text-sm">
              ({filteredEmails.length})
            </span>
          </div>

          {activeFilter !== "all" && (
            <button
              className={secondaryButton}
              onClick={() => setActiveFilter("all")}
              type="button"
            >
              Clear filter
            </button>
          )}
        </div>

        {loadingEmails ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
              <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">Loading your emails...</p>
            <p className="text-xs text-slate-500 mt-2">This may take a moment</p>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {filteredEmails.map((email) => {
                const item = analysis[email.id];
                const isGeneratingReply = replyId === email.id;
                const isSavingDraft = draftId === email.id;
                const isSending = sendId === email.id;
                const isSummarizing = loadingId === email.id;
                const isAnalyzingEmail = analyzingIds[email.id] === true;

                return (
                  <div
                    key={email.id}
                    className="overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-xl backdrop-blur"
                  >
                    <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {email.from}
                          </p>
                          <p className="mt-1 break-words text-base font-semibold text-slate-900 sm:text-lg">
                            {email.subject || "No subject"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {email.date && (
                              <p className="text-xs text-slate-500">{email.date}</p>
                            )}
                            {email.provider && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase text-slate-600">
                                {email.provider}
                              </span>
                            )}
                          </div>
                        </div>

                        {item && (
                          <div
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(
                              item.priority
                            )}`}
                          >
                            {item.priority.toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item && (
                          <>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {intentLabel(item.intent)}
                            </span>

                            {item.keywords?.slice(0, 5).map((keyword) => (
                              <span
                                key={keyword}
                                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                              >
                                {keyword}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      {isAnalyzingEmail && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          Analyzing email...
                        </div>
                      )}

                      {item?.shouldAlert && item?.alertReason && (
                        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                            Alert
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {item.alertReason}
                          </p>
                        </div>
                      )}

                      {item?.summary && (
                        <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                            Summary
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {item.summary}
                          </p>
                        </div>
                      )}

                      {item?.matchedPhrases?.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Matched phrases
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.matchedPhrases.map((phrase) => (
                              <span
                                key={phrase}
                                className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                              >
                                {phrase}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {item?.reason && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Why flagged
                          </p>
                          <p className="mt-2 text-sm text-slate-700">{item.reason}</p>
                        </div>
                      )}

                      {item?.recommendedAction && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            Recommended action
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {item.recommendedAction}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() =>
                            setExpandedEmailId((prev) =>
                              prev === email.id ? null : email.id
                            )
                          }
                        >
                          {expandedEmailId === email.id ? (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803c1.608-2.712 4.72-4.517 8.313-4.517.5 0 .997.05 1.479.15A10 10 0 0022 12z" />
                              </svg>
                              Hide full email
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View full email
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className={secondaryButton}
                          disabled={
                            !planCapabilities.canUseSummaries ||
                            isSummarizing ||
                            isGeneratingReply ||
                            isSavingDraft ||
                            isSending
                          }
                          onClick={async () => {
                            if (!planCapabilities.canUseSummaries) {
                              showUpgradeNotice("AI summaries", "premium");
                              return;
                            }

                            try {
                              setLoadingId(email.id);
                              setNotice(null);

                              const res = await fetch("/api/summarize", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  text: email.body || email.snippet,
                                }),
                              });

                              const data = await res.json();

                              if (!res.ok) {
                                setNotice({
                                  type: "error",
                                  message: data.error || "Failed to summarize.",
                                });
                                return;
                              }

                              setNotice({
                                type: "success",
                                message: data.summary,
                              });
                            } catch (error) {
                              console.error("Summarize error:", error);
                              setNotice({
                                type: "error",
                                message: "Something went wrong while summarizing.",
                              });
                            } finally {
                              setLoadingId(null);
                            }
                          }}
                        >
                          {isSummarizing ? (
                            <>
                              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Summarizing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Summarize
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className={secondaryButton}
                          disabled={
                            isSummarizing ||
                            isGeneratingReply ||
                            isSavingDraft ||
                            isSending
                          }
                          onClick={() => openForwardDraft(email)}
                        >
                          Forward
                        </button>

                        <button
                          type="button"
                          className={successButton}
                          disabled={
                            !planCapabilities.canUseSuggestedReplies ||
                            isGeneratingReply ||
                            isSavingDraft ||
                            isSending
                          }
                          onClick={() => generateReply(email, "positive")}
                        >
                          {isGeneratingReply &&
                          replyModeByEmail[email.id] === "positive"
                            ? "Writing positive..."
                            : "Positive Reply"}
                        </button>

                        <button
                          type="button"
                          className={primaryButton}
                          disabled={
                            !planCapabilities.canUseSuggestedReplies ||
                            isGeneratingReply ||
                            isSavingDraft ||
                            isSending
                          }
                          onClick={() => generateReply(email, "neutral")}
                        >
                          {isGeneratingReply &&
                          replyModeByEmail[email.id] === "neutral"
                            ? "Writing neutral..."
                            : "Neutral Reply"}
                        </button>

                        <button
                          type="button"
                          className={warningButton}
                          disabled={
                            !planCapabilities.canUseSuggestedReplies ||
                            isGeneratingReply ||
                            isSavingDraft ||
                            isSending
                          }
                          onClick={() => generateReply(email, "negative")}
                        >
                          {isGeneratingReply &&
                          replyModeByEmail[email.id] === "negative"
                            ? "Writing negative..."
                            : "Negative Reply"}
                        </button>

                        {!planCapabilities.canUseSummaries && (
                          <Link href="/pricing?feature=summaries" className={upgradeLinkClass}>
                            Upgrade for Summaries
                          </Link>
                        )}

                        {!planCapabilities.canUseSuggestedReplies && (
                          <Link href="/pricing?feature=suggested-replies" className={upgradeLinkClass}>
                            Upgrade for Suggested Replies
                          </Link>
                        )}
                      </div>

                      {expandedEmailId === email.id && email.body && (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="mb-3 text-sm font-semibold text-slate-800">
                            Full email
                          </p>
                          <div className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-white p-4 text-sm leading-6 text-slate-700 shadow-inner">
                            {email.body}
                          </div>
                        </div>
                      )}

                      {replies[email.id] && (
                        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {replyModeLabel(replyModeByEmail[email.id])} ready
                              </p>
                              <p className="text-xs text-slate-600">
                                Open the reply window to edit, review, save, or send.
                              </p>
                            </div>
                            <button
                              type="button"
                              className={primaryButton}
                              onClick={() => setActiveReplyEmailId(email.id)}
                            >
                              Open Reply Window
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!loadingEmails && filteredEmails.length === 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">No emails match this filter</p>
                <p className="text-xs text-slate-500 mt-2">Try adjusting your preferences or clearing the filter</p>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              {nextPageToken ? (
                <button
                  className={primaryButton}
                  onClick={loadMoreEmails}
                  type="button"
                  disabled={loadingMore}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {loadingMore ? "Loading more..." : "Load more emails"}
                </button>
              ) : (
                <p className="text-sm text-slate-500">No more emails to load</p>
              )}
            </div>
          </>
        )}
      </div>

      {activeReplyEmailId && activeReplyEmail && replies[activeReplyEmailId] && (
        <div
          className={`fixed inset-0 z-50 flex bg-slate-900/45 ${
            isReplyModalMaximized
              ? "items-stretch justify-stretch p-2 sm:p-4"
              : "items-center justify-center p-4"
          }`}
        >
          <div
            className={`${
              isReplyModalMaximized
                ? "h-full w-full max-w-none"
                : "flex max-h-[92vh] w-full max-w-5xl flex-col"
            } overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
          >
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">Reply Editor</p>
                <p className="text-[11px] text-slate-300">
                  {replyModeLabel(replyModeByEmail[activeReplyEmailId])} to {activeReplyEmail.from}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm hover:bg-white/10"
                  onClick={() =>
                    setIsReplyModalMaximized((prev) => !prev)
                  }
                >
                  {isReplyModalMaximized ? "Restore" : "Maximize"}
                </button>

                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm hover:bg-white/10"
                  onClick={() => setActiveReplyEmailId(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div
              className={`${
                isReplyModalMaximized
                  ? "h-[calc(100%-56px)]"
                  : "flex-1"
              } overflow-y-auto p-4`}
            >
              {/* Subject */}
              <div className="flex items-center gap-2">
                <label className="w-16 shrink-0 text-xs font-medium text-slate-500">
                  Subject
                </label>
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  value={
                    replySubjects[activeReplyEmailId] ??
                    buildReplySubject(activeReplyEmail.subject)
                  }
                  onChange={(e) =>
                    setReplySubjects((prev) => ({
                      ...prev,
                      [activeReplyEmailId]: e.target.value,
                    }))
                  }
                />
              </div>

              {/* CC */}
              <div className="mt-2 flex items-center gap-2">
                <label className="w-16 shrink-0 text-xs font-medium text-slate-500">
                  CC
                </label>
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  value={replyCCs[activeReplyEmailId] ?? ""}
                  onChange={(e) =>
                    setReplyCCs((prev) => ({
                      ...prev,
                      [activeReplyEmailId]: e.target.value,
                    }))
                  }
                  placeholder="cc@example.com"
                />
              </div>

              {/* Attachments */}
              <div className="mt-2">
                <input
                  ref={replyFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    const newAtts = await Promise.all(
                      files.map(async (f) => ({
                        name: f.name,
                        type: f.type || "application/octet-stream",
                        data: await readFileAsBase64(f),
                      }))
                    );
                    setReplyAttachments((prev) => ({
                      ...prev,
                      [activeReplyEmailId]: [
                        ...(prev[activeReplyEmailId] || []),
                        ...newAtts,
                      ],
                    }));
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                  onClick={() => replyFileInputRef.current?.click()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  Attach file
                </button>
                {(replyAttachments[activeReplyEmailId] || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(replyAttachments[activeReplyEmailId] || []).map(
                      (att, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                        >
                          <span className="max-w-[160px] truncate">{att.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyAttachments((prev) => ({
                                ...prev,
                                [activeReplyEmailId]: (
                                  prev[activeReplyEmailId] || []
                                ).filter((_, j) => j !== i),
                              }))
                            }
                            className="ml-1 text-slate-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <textarea
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                rows={8}
                value={replies[activeReplyEmailId]}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setReplies((prev) => ({
                    ...prev,
                    [activeReplyEmailId]: nextValue,
                  }));
                  setReplyReviews((prev) => {
                    const next = { ...prev };
                    delete next[activeReplyEmailId];
                    return next;
                  });
                }}
              />

              <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                <button
                  type="button"
                  className={secondaryButton}
                  disabled={
                    !planCapabilities.canUseAiDraftReview ||
                    reviewingReplyId === activeReplyEmailId ||
                    draftId === activeReplyEmailId ||
                    sendId === activeReplyEmailId
                  }
                  onClick={() => reviewReplyDraft(activeReplyEmail, "general")}
                >
                  {reviewingReplyId === activeReplyEmailId
                    ? "Reviewing..."
                    : "AI Review Reply"}
                </button>

                <button
                  type="button"
                  className={secondaryButton}
                  disabled={
                    !planCapabilities.canUseAiDraftReview ||
                    reviewingReplyId === activeReplyEmailId ||
                    draftId === activeReplyEmailId ||
                    sendId === activeReplyEmailId
                  }
                  onClick={() => reviewReplyDraft(activeReplyEmail, "professional")}
                >
                  Make more professional
                </button>

                <button
                  type="button"
                  className={secondaryButton}
                  disabled={
                    !planCapabilities.canUseAiDraftReview ||
                    reviewingReplyId === activeReplyEmailId ||
                    draftId === activeReplyEmailId ||
                    sendId === activeReplyEmailId
                  }
                  onClick={() => reviewReplyDraft(activeReplyEmail, "shorter")}
                >
                  Make shorter
                </button>

                <button
                  type="button"
                  className={secondaryButton}
                  disabled={
                    !planCapabilities.canUseAiDraftReview ||
                    reviewingReplyId === activeReplyEmailId ||
                    draftId === activeReplyEmailId ||
                    sendId === activeReplyEmailId
                  }
                  onClick={() => reviewReplyDraft(activeReplyEmail, "polite")}
                >
                  Make polite
                </button>

                <button
                  type="button"
                  className={secondaryButton}
                  disabled={
                    !planCapabilities.canUseAiDraftReview ||
                    reviewingReplyId === activeReplyEmailId ||
                    draftId === activeReplyEmailId ||
                    sendId === activeReplyEmailId
                  }
                  onClick={() => reviewReplyDraft(activeReplyEmail, "persuasive")}
                >
                  Make persuasive
                </button>

                {!planCapabilities.canUseAiDraftReview && (
                  <Link href="/pricing?feature=ai-review" className={upgradeLinkClass}>
                    Upgrade for AI Review
                  </Link>
                )}

                <button
                  type="button"
                  className={primaryButton}
                  disabled={
                    draftId === activeReplyEmailId || sendId === activeReplyEmailId
                  }
                  onClick={async () => {
                    try {
                      setDraftId(activeReplyEmailId);
                      setNotice(null);

                      const to =
                        activeReplyEmail.fromEmail ||
                        extractEmailAddress(activeReplyEmail.from);

                      const res = await fetch("/api/draft", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          to,
                          subject:
                            replySubjects[activeReplyEmailId] ??
                            buildReplySubject(activeReplyEmail.subject),
                          body: replies[activeReplyEmailId],
                          threadId: activeReplyEmail.threadId,
                          cc: replyCCs[activeReplyEmailId] || undefined,
                          attachments:
                            replyAttachments[activeReplyEmailId]?.length
                              ? replyAttachments[activeReplyEmailId]
                              : undefined,
                        }),
                      });

                      const data = await res.json();

                      if (!res.ok) {
                        setNotice({
                          type: "error",
                          message: data.error || "Failed to create draft.",
                        });
                        return;
                      }

                      setNotice({
                        type: "success",
                        message: "Draft saved to provider.",
                      });
                    } catch {
                      setNotice({
                        type: "error",
                        message: "Something went wrong while saving draft.",
                      });
                    } finally {
                      setDraftId(null);
                    }
                  }}
                >
                  {draftId === activeReplyEmailId ? "Saving..." : "Save Draft"}
                </button>

                <button
                  type="button"
                  className={successButton}
                  disabled={
                    draftId === activeReplyEmailId || sendId === activeReplyEmailId
                  }
                  onClick={async () => {
                    try {
                      setSendId(activeReplyEmailId);
                      setNotice(null);

                      const to =
                        activeReplyEmail.fromEmail ||
                        extractEmailAddress(activeReplyEmail.from);

                      const res = await fetch("/api/send", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          to,
                          subject:
                            replySubjects[activeReplyEmailId] ??
                            buildReplySubject(activeReplyEmail.subject),
                          body: replies[activeReplyEmailId],
                          threadId: activeReplyEmail.threadId,
                          cc: replyCCs[activeReplyEmailId] || undefined,
                          attachments:
                            replyAttachments[activeReplyEmailId]?.length
                              ? replyAttachments[activeReplyEmailId]
                              : undefined,
                        }),
                      });

                      const data = await res.json();

                      if (!res.ok) {
                        setNotice({
                          type: "error",
                          message: data.error || "Failed to send email.",
                        });
                        return;
                      }

                      setNotice({
                        type: "success",
                        message: "Reply sent.",
                      });

                      setReplies((prev) => {
                        const next = { ...prev };
                        delete next[activeReplyEmailId];
                        return next;
                      });

                      setReplyModeByEmail((prev) => {
                        const next = { ...prev };
                        delete next[activeReplyEmailId];
                        return next;
                      });

                      setReplyReviews((prev) => {
                        const next = { ...prev };
                        delete next[activeReplyEmailId];
                        return next;
                      });

                      setReplySubjects((prev) => {
                        const next = { ...prev };
                        delete next[activeReplyEmailId];
                        return next;
                      });

                      setReplyCCs((prev) => {
                        const next = { ...prev };
                        delete next[activeReplyEmailId];
                        return next;
                      });

                      setReplyAttachments((prev) => {
                        const next = { ...prev };
                        delete next[activeReplyEmailId];
                        return next;
                      });

                      setActiveReplyEmailId(null);
                    } catch {
                      setNotice({
                        type: "error",
                        message: "Something went wrong while sending reply.",
                      });
                    } finally {
                      setSendId(null);
                    }
                  }}
                >
                  {sendId === activeReplyEmailId ? "Sending..." : "Send Reply"}
                </button>

                <button
                  type="button"
                  className={dangerButton}
                  disabled={
                    draftId === activeReplyEmailId || sendId === activeReplyEmailId
                  }
                  onClick={() => discardReply(activeReplyEmailId)}
                >
                  Discard
                </button>
              </div>


            </div>
          </div>
        </div>
      )}

      {isComposeOpen && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 w-full px-0 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:bottom-4 sm:left-auto sm:right-4 sm:px-0 sm:pb-0 ${composeReview ? "sm:max-w-[min(72rem,calc(100vw-2rem))]" : "sm:max-w-[min(42rem,calc(100vw-2rem))]"}`}>
          <div className="flex max-h-[88vh] flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-5rem)] sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between bg-slate-900 px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">New Message</p>
                <p className="text-[11px] text-slate-300">
                  Compose, review with AI, save, send, or discard
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm hover:bg-white/10"
                  onClick={() => setIsComposeMinimized((prev) => !prev)}
                >
                  {isComposeMinimized ? "Expand" : "Minimize"}
                </button>

                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm hover:bg-white/10"
                  onClick={closeCompose}
                >
                  Close
                </button>
              </div>
            </div>

            {!isComposeMinimized && (
              <div className={`flex min-h-0 flex-1 flex-col xl:flex-row ${composeReview ? "gap-0" : ""}`}>
                {/* Compose Form - Left/Center */}
                <div className={`overflow-y-auto p-4 ${composeReview ? "flex-1 xl:border-r xl:border-slate-200" : "w-full"}`}>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        To
                      </label>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        value={composeTo}
                        onChange={(e) => setComposeTo(e.target.value)}
                        placeholder="client@example.com"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        CC
                      </label>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        value={composeCc}
                        onChange={(e) => setComposeCc(e.target.value)}
                        placeholder="cc@example.com, another@example.com"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Subject
                      </label>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        value={composeSubject}
                        onChange={(e) => setComposeSubject(e.target.value)}
                        placeholder="Subject line"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Message
                      </label>
                      <textarea
                        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        rows={8}
                        value={composeBody}
                        onChange={(e) => {
                          setComposeBody(e.target.value);
                          setComposeReview(null);
                        }}
                        placeholder="Write your email here..."
                      />
                    </div>

                    {/* Attachments */}
                    <div>
                      <input
                        ref={composeFileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (!files.length) return;
                          const newAtts = await Promise.all(
                            files.map(async (f) => ({
                              name: f.name,
                              type: f.type || "application/octet-stream",
                              data: await readFileAsBase64(f),
                            }))
                          );
                          setComposeAttachments((prev) => [...prev, ...newAtts]);
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
                        onClick={() => composeFileInputRef.current?.click()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        Attach file
                      </button>
                      {composeAttachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {composeAttachments.map((att, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                            >
                              <span className="max-w-[160px] truncate">{att.name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setComposeAttachments((prev) =>
                                    prev.filter((_, j) => j !== i)
                                  )
                                }
                                className="ml-1 text-slate-400 hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className={secondaryButton}
                        disabled={
                          !planCapabilities.canUseAiDraftReview ||
                          composeReviewLoading || composeSaving || composeSending
                        }
                        onClick={() => reviewComposeDraft("general")}
                      >
                        {composeReviewLoading ? "Reviewing..." : "AI Review"}
                      </button>

                      <button
                        type="button"
                        className={secondaryButton}
                        disabled={
                          !planCapabilities.canUseAiDraftReview ||
                          composeReviewLoading || composeSaving || composeSending
                        }
                        onClick={() => reviewComposeDraft("professional")}
                      >
                        Make more professional
                      </button>

                      <button
                        type="button"
                        className={secondaryButton}
                        disabled={
                          !planCapabilities.canUseAiDraftReview ||
                          composeReviewLoading || composeSaving || composeSending
                        }
                        onClick={() => reviewComposeDraft("shorter")}
                      >
                        Make shorter
                      </button>

                      <button
                        type="button"
                        className={secondaryButton}
                        disabled={
                          !planCapabilities.canUseAiDraftReview ||
                          composeReviewLoading || composeSaving || composeSending
                        }
                        onClick={() => reviewComposeDraft("polite")}
                      >
                        Make polite
                      </button>

                      <button
                        type="button"
                        className={secondaryButton}
                        disabled={
                          !planCapabilities.canUseAiDraftReview ||
                          composeReviewLoading || composeSaving || composeSending
                        }
                        onClick={() => reviewComposeDraft("persuasive")}
                      >
                        Make persuasive
                      </button>

                      {!planCapabilities.canUseAiDraftReview && (
                        <Link href="/pricing?feature=ai-review" className={upgradeLinkClass}>
                          Upgrade for AI Review
                        </Link>
                      )}

                      <button
                        type="button"
                        className={primaryButton}
                        disabled={
                          composeReviewLoading || composeSaving || composeSending
                        }
                        onClick={saveComposeDraft}
                      >
                        {composeSaving ? "Saving..." : "Save Draft"}
                      </button>

                      <button
                        type="button"
                        className={successButton}
                        disabled={
                          composeReviewLoading || composeSaving || composeSending
                        }
                        onClick={sendComposeEmail}
                      >
                        {composeSending ? "Sending..." : "Send Email"}
                      </button>

                      <button
                        type="button"
                        className={dangerButton}
                        disabled={
                          composeReviewLoading || composeSaving || composeSending
                        }
                        onClick={discardCompose}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Review Panel - Right Sidebar */}
                {composeReview && (
                  <div className="max-h-[280px] w-full overflow-y-auto bg-indigo-50/70 p-4 xl:max-h-none xl:w-96">
                    <div className="mb-4 flex items-center justify-between gap-2 sticky top-0 bg-indigo-50/70 pb-2">
                      <p className="text-sm font-semibold text-slate-800">
                        AI suggestions
                      </p>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium"
                        onClick={() => {
                          setComposeSubject(
                            composeReview.improvedSubject || composeSubject
                          );
                          setComposeBody(
                            composeReview.improvedBody || composeBody
                          );
                          setNotice({
                            type: "success",
                            message:
                              "AI-reviewed version applied to compose draft.",
                          });
                        }}
                      >
                        Use All
                      </button>
                    </div>

                    <div className="space-y-3">
                      {composeReview.suggestions &&
                        composeReview.suggestions.length > 0 && (
                          <div className="mb-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Tips
                            </p>
                            <div className="space-y-2">
                              {composeReview.suggestions.map((suggestion, index) => (
                                <div
                                  key={`${suggestion}-${index}`}
                                  className="rounded-lg bg-white px-3 py-2 text-xs text-slate-700 shadow-sm border-l-2 border-indigo-300"
                                >
                                  • {suggestion}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <div className="border-t border-indigo-200 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Improved subject
                        </p>
                        <div className="rounded-lg bg-white p-2 text-xs text-slate-800 shadow-sm mb-2 flex items-start gap-2">
                          <div className="flex-1 break-words">{composeReview.improvedSubject || composeSubject || "No subject"}</div>
                          <button
                            type="button"
                            className="flex-shrink-0 text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                            onClick={() => {
                              setComposeSubject(composeReview.improvedSubject || composeSubject);
                              setNotice({ type: "success", message: "Subject copied" });
                            }}
                            title="Copy to subject"
                          >
                            📋
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-indigo-200 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Improved body
                        </p>
                        <div className="rounded-lg bg-white p-2 text-xs text-slate-800 shadow-sm max-h-48 overflow-y-auto whitespace-pre-wrap mb-2 flex items-start gap-2">
                          <div className="flex-1 break-words">{composeReview.improvedBody || composeBody}</div>
                        </div>
                        <button
                          type="button"
                          className="w-full text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-medium text-xs py-2 rounded border border-indigo-200"
                          onClick={() => {
                            setComposeBody(composeReview.improvedBody || composeBody);
                            setNotice({ type: "success", message: "Body copied" });
                          }}
                        >
                          📋 Copy to body
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isPreferencesOpen && (
        <div
          className={`fixed z-50 w-full px-0 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:max-w-2xl sm:px-4 sm:pb-0 ${
            isPreferenceSetupRequired
              ? "inset-0 mx-auto flex items-center justify-center bg-slate-900/35 p-4"
              : "bottom-0 left-0 right-0 sm:bottom-6 sm:left-auto sm:right-6"
          }`}
        >
          <div className="max-h-[88vh] overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-none sm:rounded-2xl">
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">Preferences</p>
                <p className="text-[11px] text-slate-300">
                  Configure email analysis and alert settings
                </p>
                <p className="text-[11px] text-slate-400">
                  {preferencesUpdatedAt
                    ? `Last saved ${new Date(preferencesUpdatedAt).toLocaleString()}`
                    : "Never saved yet"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isPreferenceSetupRequired && (
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-sm hover:bg-white/10"
                    onClick={() => setIsPreferencesMinimized((prev) => !prev)}
                  >
                    {isPreferencesMinimized ? "Expand" : "Minimize"}
                  </button>
                )}

                {!isPreferenceSetupRequired && (
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-sm hover:bg-white/10"
                      onClick={() => {
                        if (prefAutoHideTimerRef.current) {
                          clearTimeout(prefAutoHideTimerRef.current);
                          prefAutoHideTimerRef.current = null;
                        }
                        setIsPreferencesOpen(false);
                      }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {!isPreferencesMinimized && (
              <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="space-y-6">
                  {isPreferenceSetupRequired && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                      Complete this one-time setup before using your dashboard.
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Subscription Plan
                    </label>
                    <p className="mb-3 text-sm text-slate-600">
                      Choose your current plan to lock or unlock features.
                    </p>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      value={planTier}
                      onChange={(e) => setPlanTier(e.target.value as PlanTier)}
                    >
                      <option value="basic">Basic - Free</option>
                      <option value="premium">Premium - £3.99/month</option>
                      <option value="gold">Gold - £8.99/month</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">Keyword Tracking Rules</label>
                    <p className="mb-3 text-sm text-slate-600">
                      Enter comma-separated terms to detect in email body content
                      {!planCapabilities.canUseSmartAlerts
                        ? " (Premium/Gold only)."
                        : ""}
                    </p>
                    {!planCapabilities.canUseSmartAlerts && (
                      <div className="mb-3">
                        <Link href="/pricing?feature=smart-alerts" className={upgradeLinkClass}>
                          Upgrade for Smart Alerts
                        </Link>
                      </div>
                    )}
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="e.g., refund, cancel, pricing, urgent"
                      disabled={!planCapabilities.canUseSmartAlerts}
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-900">Alert Categories</label>
                    <div className="space-y-2">
                      <label className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition w-full">
                        <input
                          type="checkbox"
                          checked={alertUrgent}
                          onChange={(e) => setAlertUrgent(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600"
                          disabled={!planCapabilities.canUseSmartAlerts}
                        />
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-600">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                            </svg>
                          </div>
                          <span>Show urgent emails</span>
                        </div>
                      </label>

                      <label className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition w-full">
                        <input
                          type="checkbox"
                          checked={alertComplaint}
                          onChange={(e) => setAlertComplaint(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-rose-600"
                          disabled={!planCapabilities.canUseSmartAlerts}
                        />
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded bg-rose-100 text-rose-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2" />
                            </svg>
                          </div>
                          <span>Show complaint emails</span>
                        </div>
                      </label>

                      <label className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition w-full">
                        <input
                          type="checkbox"
                          checked={alertSales}
                          onChange={(e) => setAlertSales(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600"
                          disabled={!planCapabilities.canUseSmartAlerts}
                        />
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-100 text-emerald-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <span>Show sales opportunities</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dontShowPreferencesNextTime}
                      onChange={(e) => setDontShowPreferencesNextTime(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    />
                    <span>Don&apos;t show this next time I log in</span>
                  </label>

                  <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-3">
                    <button
                      className={primaryButton}
                      type="button"
                      onClick={savePreferences}
                      disabled={savingPreferences}
                    >
                      {savingPreferences ? "Saving..." : "Save Preferences"}
                    </button>

                    <button
                      className={secondaryButton}
                      onClick={rerunAnalysis}
                      type="button"
                      disabled={analyzing || loadingEmails}
                    >
                      {analyzing ? "Analyzing..." : "Refresh Insights"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isPreferencesOpen && showSetupPreferencesWidget && (
        <div className="fixed bottom-4 right-4 z-40 hidden w-80 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur lg:block">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Setup Preferences</p>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              {completedPreferenceSteps}/{preferenceChecklist.length}
            </span>
          </div>

          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
              style={{ width: `${preferenceProgressPercent}%` }}
            />
          </div>

          <ul className="space-y-2">
            {preferenceChecklist.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 text-sm text-slate-700"
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    item.done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.done ? "✓" : "•"}
                </span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-indigo-700"
            onClick={() => {
              setIsPreferencesOpen(true);
              setIsPreferencesMinimized(false);
            }}
          >
            Open Preferences
          </button>
        </div>
      )}
    </main>
    </>
  );
}