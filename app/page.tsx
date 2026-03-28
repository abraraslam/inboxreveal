"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

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

export default function Home() {
  const { data: session } = useSession();

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

  const [keywordInput, setKeywordInput] = useState("refund,cancel,pricing");
  const [alertUrgent, setAlertUrgent] = useState(true);
  const [alertComplaint, setAlertComplaint] = useState(true);
  const [alertSales, setAlertSales] = useState(true);

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeReviewLoading, setComposeReviewLoading] = useState(false);
  const [composeSaving, setComposeSaving] = useState(false);
  const [composeSending, setComposeSending] = useState(false);
  const [composeReview, setComposeReview] = useState<DraftReviewResponse | null>(
    null
  );
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isComposeMinimized, setIsComposeMinimized] = useState(false);

  const [reviewingReplyId, setReviewingReplyId] = useState<string | null>(null);
  const [replyReviews, setReplyReviews] = useState<
    Record<string, DraftReviewResponse>
  >({});

  const customKeywords = useMemo(
    () =>
      keywordInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    [keywordInput]
  );

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
      const data: SavedAnalysisResponse = await res.json();

      if (!res.ok) {
        throw new Error("Failed to load saved analysis");
      }

      const savedAnalysis = data.analysis || {};
      mergeSavedAnalysis(savedAnalysis);
      return savedAnalysis;
    } catch (error) {
      console.error("Failed to load saved analysis:", error);
      return {} as Record<string, Analysis>;
    }
  };

  const analyzeEmails = async (
    data: Email[],
    keywordsToUse: string[] = customKeywords
  ) => {
    if (!data.length) return;

    try {
      setAnalyzing(true);

      const batchSize = 5;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (email) => {
            try {
              setAnalyzingIds((prev) => ({
                ...prev,
                [email.id]: true,
              }));

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

              const result = await res.json();

              if (!res.ok) {
                throw new Error(result.error || "Failed to analyze email");
              }

              setAnalysis((prev) => ({
                ...prev,
                [email.id]: result,
              }));
            } catch (error) {
              console.error("Analyze failed for email:", email.id, error);
            } finally {
              setAnalyzingIds((prev) => {
                const next = { ...prev };
                delete next[email.id];
                return next;
              });
            }
          })
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.email) return;

    fetch(`/api/preferences?email=${encodeURIComponent(session.user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;

        setKeywordInput((data.keywords || []).join(","));
        setAlertUrgent(data.alert_urgent ?? true);
        setAlertComplaint(data.alert_complaint ?? true);
        setAlertSales(data.alert_sales ?? true);
      })
      .catch((error) => {
        console.error("Failed to load preferences:", error);
      });
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const loadEmails = async () => {
      try {
        setLoadingEmails(true);
        setNotice(null);

        const res = await fetch("/api/emails");
        const data: GmailResponse | Email[] = await res.json();

        if (!res.ok) {
          throw new Error(
            (data as { message?: string; error?: string })?.message ||
              (data as { message?: string; error?: string })?.error ||
              "Failed to load emails"
          );
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
          message: "Failed to load emails.",
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
    setComposeReview(null);
    setIsComposeOpen(false);
    setIsComposeMinimized(false);

    setNotice({
      type: "success",
      message: "Compose draft discarded.",
    });
  };

  const reviewComposeDraft = async (action: ReviewAction = "general") => {
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

      setNotice({
        type: "success",
        message: "AI review completed for your new email.",
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

      setReplyReviews((prev) => ({
        ...prev,
        [email.id]: data,
      }));

      setNotice({
        type: "success",
        message: "AI reviewed the reply draft.",
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
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

  const primaryButton = `${buttonBase} bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:from-blue-700 hover:to-indigo-700`;
  const secondaryButton = `${buttonBase} border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50`;
  const successButton = `${buttonBase} bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow hover:from-emerald-600 hover:to-teal-600`;
  const warningButton = `${buttonBase} bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow hover:from-amber-600 hover:to-orange-600`;
  const dangerButton = `${buttonBase} bg-gradient-to-r from-rose-500 to-red-500 text-white shadow hover:from-rose-600 hover:to-red-600`;
  const ghostButton =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition";

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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-10">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-white/60 bg-white/80 p-10 text-center shadow-2xl backdrop-blur">
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            InboxIntel
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-3 text-sm text-slate-600">
            Sign in to analyze inbox activity, surface important emails, and
            draft replies faster.
          </p>
          <button
            onClick={() => signIn("google")}
            className={`${primaryButton} mt-6 w-full`}
          >
            Sign in with email provider
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow">
                Smart Inbox Dashboard
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                InboxIntel
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                AI-powered email intelligence with prioritization, body-level
                insights, assisted replies, and AI-reviewed drafts.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className={primaryButton}
                type="button"
                onClick={() => {
                  setIsComposeOpen(true);
                  setIsComposeMinimized(false);
                }}
              >
                Compose Email
              </button>

              <button
                className={secondaryButton}
                onClick={rerunAnalysis}
                type="button"
                disabled={analyzing || loadingEmails}
              >
                {analyzing ? "Analyzing..." : "Re-run analysis"}
              </button>

              <button
                onClick={() => signOut()}
                className={ghostButton}
                type="button"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {notice && (
          <div
            className={`mb-6 rounded-2xl border p-4 shadow-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{notice.message}</p>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-white/60"
                onClick={() => setNotice(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Inbox display preferences
            </h2>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Personalize detection
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Keyword tracking rules
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="refund, cancel, pricing, meetings"
              />
              <p className="mt-2 text-xs text-slate-500">
                Enter comma-separated terms to detect in email body content.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                <input
                  type="checkbox"
                  checked={alertUrgent}
                  onChange={(e) => setAlertUrgent(e.target.checked)}
                />
                Show urgent emails
              </label>

              <label className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                <input
                  type="checkbox"
                  checked={alertComplaint}
                  onChange={(e) => setAlertComplaint(e.target.checked)}
                />
                Show complaint emails
              </label>

              <label className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <input
                  type="checkbox"
                  checked={alertSales}
                  onChange={(e) => setAlertSales(e.target.checked)}
                />
                Show sales emails
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className={primaryButton}
                type="button"
                onClick={async () => {
                  try {
                    setNotice(null);

                    const res = await fetch("/api/preferences", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        email: session?.user?.email,
                        keywords: customKeywords,
                        alertUrgent,
                        alertComplaint,
                        alertSales,
                      }),
                    });

                    if (!res.ok) {
                      throw new Error("Failed to save preferences");
                    }

                    setNotice({
                      type: "success",
                      message: "Preferences saved.",
                    });
                  } catch {
                    setNotice({
                      type: "error",
                      message: "Failed to save preferences.",
                    });
                  }
                }}
              >
                Save preferences
              </button>

              <button
                className={secondaryButton}
                onClick={rerunAnalysis}
                type="button"
                disabled={analyzing || loadingEmails}
              >
                {analyzing ? "Analyzing..." : "Refresh insights"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <button
            type="button"
            className={statCardClass("all")}
            onClick={() => setActiveFilter("all")}
          >
            <p className="text-sm text-slate-500">All Emails</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {emails.length}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {activeFilter === "all" ? "Selected" : "Show all"}
            </p>
          </button>

          <button
            type="button"
            className={statCardClass("alerted")}
            onClick={() => setActiveFilter("alerted")}
          >
            <p className="text-sm text-slate-500">Alerted Emails</p>
            <p className="mt-2 text-3xl font-bold text-orange-600">
              {alertedCount}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {activeFilter === "alerted" ? "Selected" : "Show only these"}
            </p>
          </button>

          <button
            type="button"
            className={statCardClass("high_priority")}
            onClick={() => setActiveFilter("high_priority")}
          >
            <p className="text-sm text-slate-500">High Priority</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {highPriorityCount}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {activeFilter === "high_priority"
                ? "Selected"
                : "Show only these"}
            </p>
          </button>

          <button
            type="button"
            className={statCardClass("complaint")}
            onClick={() => setActiveFilter("complaint")}
          >
            <p className="text-sm text-slate-500">Complaints</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              {complaintCount}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {activeFilter === "complaint" ? "Selected" : "Show only these"}
            </p>
          </button>

          <button
            type="button"
            className={statCardClass("sales_opportunity")}
            onClick={() => setActiveFilter("sales_opportunity")}
          >
            <p className="text-sm text-slate-500">Sales Opportunities</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {salesCount}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {activeFilter === "sales_opportunity"
                ? "Selected"
                : "Show only these"}
            </p>
          </button>

          <button
            type="button"
            className={statCardClass("keyword_hits")}
            onClick={() => setActiveFilter("keyword_hits")}
          >
            <p className="text-sm text-slate-500">Keyword Hits</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {keywordHitsCount}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              {activeFilter === "keyword_hits" ? "Selected" : "Show only these"}
            </p>
          </button>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Showing:{" "}
            <span className="font-semibold text-slate-900">
              {filterLabel(activeFilter)}
            </span>{" "}
            <span className="text-slate-400">({filteredEmails.length})</span>
          </p>

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
          <div className="rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
            <p className="text-sm font-medium text-slate-500">Loading emails...</p>
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
                const isReviewingReply = reviewingReplyId === email.id;
                const reviewedReply = replyReviews[email.id];

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
                          <p className="mt-1 text-lg font-semibold text-slate-900">
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
                      <p className="text-sm leading-6 text-slate-600">
                        {email.snippet}
                      </p>

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

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() =>
                            setExpandedEmailId((prev) =>
                              prev === email.id ? null : email.id
                            )
                          }
                        >
                          {expandedEmailId === email.id
                            ? "Hide full email"
                            : "View full email"}
                        </button>

                        <button
                          type="button"
                          className={secondaryButton}
                          disabled={isSummarizing}
                          onClick={async () => {
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
                            } catch {
                              setNotice({
                                type: "error",
                                message: "Something went wrong while summarizing.",
                              });
                            } finally {
                              setLoadingId(null);
                            }
                          }}
                        >
                          {isSummarizing ? "Summarizing..." : "Summarize"}
                        </button>

                        <button
                          type="button"
                          className={successButton}
                          disabled={isGeneratingReply || isSavingDraft || isSending}
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
                          disabled={isGeneratingReply || isSavingDraft || isSending}
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
                          disabled={isGeneratingReply || isSavingDraft || isSending}
                          onClick={() => generateReply(email, "negative")}
                        >
                          {isGeneratingReply &&
                          replyModeByEmail[email.id] === "negative"
                            ? "Writing negative..."
                            : "Negative Reply"}
                        </button>
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
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">
                              {replyModeLabel(replyModeByEmail[email.id])}
                            </p>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                              Editable draft
                            </span>
                          </div>

                          <textarea
                            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            rows={6}
                            value={replies[email.id]}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              setReplies((prev) => ({
                                ...prev,
                                [email.id]: nextValue,
                              }));
                              setReplyReviews((prev) => {
                                const next = { ...prev };
                                delete next[email.id];
                                return next;
                              });
                            }}
                          />

                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              className={secondaryButton}
                              disabled={isReviewingReply || isSavingDraft || isSending}
                              onClick={() => reviewReplyDraft(email, "general")}
                            >
                              {isReviewingReply ? "Reviewing..." : "AI Review Reply"}
                            </button>

                            <button
                              type="button"
                              className={secondaryButton}
                              disabled={isReviewingReply || isSavingDraft || isSending}
                              onClick={() => reviewReplyDraft(email, "professional")}
                            >
                              Make more professional
                            </button>

                            <button
                              type="button"
                              className={secondaryButton}
                              disabled={isReviewingReply || isSavingDraft || isSending}
                              onClick={() => reviewReplyDraft(email, "shorter")}
                            >
                              Make shorter
                            </button>

                            <button
                              type="button"
                              className={secondaryButton}
                              disabled={isReviewingReply || isSavingDraft || isSending}
                              onClick={() => reviewReplyDraft(email, "polite")}
                            >
                              Make polite
                            </button>

                            <button
                              type="button"
                              className={secondaryButton}
                              disabled={isReviewingReply || isSavingDraft || isSending}
                              onClick={() => reviewReplyDraft(email, "persuasive")}
                            >
                              Make persuasive
                            </button>

                            <button
                              type="button"
                              className={primaryButton}
                              disabled={isSavingDraft || isSending}
                              onClick={async () => {
                                try {
                                  setDraftId(email.id);
                                  setNotice(null);

                                  const to =
                                    email.fromEmail || extractEmailAddress(email.from);

                                  const res = await fetch("/api/draft", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      to,
                                      subject: buildReplySubject(email.subject),
                                      body: replies[email.id],
                                      threadId: email.threadId,
                                    }),
                                  });

                                  const data = await res.json();

                                  if (!res.ok) {
                                    setNotice({
                                      type: "error",
                                      message:
                                        data.error || "Failed to create draft.",
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
                                    message:
                                      "Something went wrong while saving draft.",
                                  });
                                } finally {
                                  setDraftId(null);
                                }
                              }}
                            >
                              {isSavingDraft ? "Saving..." : "Save Draft"}
                            </button>

                            <button
                              type="button"
                              className={successButton}
                              disabled={isSavingDraft || isSending}
                              onClick={async () => {
                                try {
                                  setSendId(email.id);
                                  setNotice(null);

                                  const to =
                                    email.fromEmail || extractEmailAddress(email.from);

                                  const res = await fetch("/api/send", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      to,
                                      subject: buildReplySubject(email.subject),
                                      body: replies[email.id],
                                      threadId: email.threadId,
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
                                    delete next[email.id];
                                    return next;
                                  });

                                  setReplyModeByEmail((prev) => {
                                    const next = { ...prev };
                                    delete next[email.id];
                                    return next;
                                  });

                                  setReplyReviews((prev) => {
                                    const next = { ...prev };
                                    delete next[email.id];
                                    return next;
                                  });
                                } catch {
                                  setNotice({
                                    type: "error",
                                    message:
                                      "Something went wrong while sending reply.",
                                  });
                                } finally {
                                  setSendId(null);
                                }
                              }}
                            >
                              {isSending ? "Sending..." : "Send Reply"}
                            </button>

                            <button
                              type="button"
                              className={dangerButton}
                              disabled={isSavingDraft || isSending}
                              onClick={() => discardReply(email.id)}
                            >
                              Discard
                            </button>
                          </div>

                          {reviewedReply && (
                            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-800">
                                  AI reply review
                                </p>
                                <button
                                  type="button"
                                  className={secondaryButton}
                                  onClick={() => {
                                    setReplies((prev) => ({
                                      ...prev,
                                      [email.id]:
                                        reviewedReply.improvedBody || prev[email.id],
                                    }));
                                    setNotice({
                                      type: "success",
                                      message:
                                        "AI-reviewed version applied to reply draft.",
                                    });
                                  }}
                                >
                                  Use AI Version
                                </button>
                              </div>

                              {reviewedReply.suggestions &&
                                reviewedReply.suggestions.length > 0 && (
                                  <div className="mb-4 space-y-2">
                                    {reviewedReply.suggestions.map(
                                      (suggestion, index) => (
                                        <div
                                          key={`${suggestion}-${index}`}
                                          className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                                        >
                                          {suggestion}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}

                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Improved reply
                                </p>
                                <div className="whitespace-pre-wrap rounded-xl bg-white p-3 text-sm text-slate-800 shadow-sm">
                                  {reviewedReply.improvedBody || replies[email.id]}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!loadingEmails && filteredEmails.length === 0 && (
              <div className="mt-6 rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
                <p className="text-sm font-medium text-slate-500">
                  No emails match this filter.
                </p>
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
                  {loadingMore ? "Loading more..." : "Load more emails"}
                </button>
              ) : (
                <p className="text-sm text-slate-500">No more emails</p>
              )}
            </div>
          </>
        )}
      </div>

      {isComposeOpen && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 sm:px-0 ${composeReview ? "w-full max-w-6xl" : "w-full max-w-2xl"}`}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
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
              <div className={`flex ${composeReview ? "gap-0" : ""}`}>
                {/* Compose Form - Left/Center */}
                <div className={`p-4 ${composeReview ? "flex-1 border-r border-slate-200" : "w-full"}`}>
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
                        rows={10}
                        value={composeBody}
                        onChange={(e) => {
                          setComposeBody(e.target.value);
                          setComposeReview(null);
                        }}
                        placeholder="Write your email here..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className={secondaryButton}
                        disabled={
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
                          composeReviewLoading || composeSaving || composeSending
                        }
                        onClick={() => reviewComposeDraft("persuasive")}
                      >
                        Make persuasive
                      </button>

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
                  <div className="max-h-[600px] w-96 overflow-y-auto bg-indigo-50/70 p-4">
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
    </main>
  );
}