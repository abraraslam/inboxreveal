import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function EmailAnalysisCard({
  sender = "Google <no-reply@accounts.google.com>",
  subject = "Security alert",
  date = "Mon, 13 Apr 2026 21:19:25 GMT",
  provider = "GMAIL",
  tags = ["Urgent", "Google Account", "access", "secure", "activity"],
  alert = "Urgent email requires attention.",
  summary = "Immediate action is required to secure the account.",
  matchedPhrases = [
    "important changes to your Google Account",
    "check your account activity",
    "secure your account",
  ],
  whyFlagged = "Potential unauthorized access to Google Account.",
  recommendedAction = "Check your account activity now.",
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 max-w-2xl mx-auto my-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="font-semibold text-slate-900">{subject}</div>
        <span className="text-xs text-slate-500">{provider}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs text-slate-500">{sender}</span>
        <span className="text-xs text-slate-400">•</span>
        <span className="text-xs text-slate-500">{date}</span>
      </div>
      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
      {/* Alert & Summary */}
      <div className="flex flex-col md:flex-row gap-2 mb-2">
        <div className="flex-1 flex items-center gap-2 bg-red-50 rounded px-2 py-1">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-xs text-red-700 font-semibold">{alert}</span>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-blue-50 rounded px-2 py-1">
          <CheckCircle2 className="h-4 w-4 text-blue-400" />
          <span className="text-xs text-blue-700">{summary}</span>
        </div>
      </div>
      {/* Matched Phrases */}
      <div className="flex flex-wrap gap-1 mb-2">
        {matchedPhrases.map((phrase) => (
          <span
            key={phrase}
            className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded"
          >
            {phrase}
          </span>
        ))}
      </div>
      {/* Why Flagged & Recommended Action */}
      <div className="flex flex-col md:flex-row gap-2 mb-2">
        <div className="flex-1 bg-slate-50 rounded px-2 py-1 text-xs text-slate-700">
          <span className="font-semibold">Why flagged: </span>
          {whyFlagged}
        </div>
        <div className="flex-1 bg-emerald-50 rounded px-2 py-1 text-xs text-emerald-700">
          <span className="font-semibold">Recommended: </span>
          {recommendedAction}
        </div>
      </div>
      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-2">
        <button className="bg-slate-100 hover:bg-slate-200 text-xs px-3 py-1 rounded">View full email</button>
        <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs px-3 py-1 rounded">Summarize</button>
        <button className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs px-3 py-1 rounded">Positive Reply</button>
        <button className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs px-3 py-1 rounded">Neutral Reply</button>
        <button className="bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs px-3 py-1 rounded">Negative Reply</button>
      </div>
    </div>
  );
}
