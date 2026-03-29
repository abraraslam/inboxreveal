export default function EmailList() {
  const emails = [
    { 
      from: "Google", 
      subject: "Welcome to Gmail App", 
      preview: "Thanks for trying your first Next.js Gmail UI.", 
      time: "10:30 AM",
      priority: "medium"
    },
    { 
      from: "OpenAI", 
      subject: "Your project update", 
      preview: "Your app is running successfully on localhost:3000.", 
      time: "9:15 AM",
      priority: "high"
    },
    { 
      from: "GitHub", 
      subject: "New login detected", 
      preview: "We noticed a new sign in to your account.", 
      time: "Yesterday",
      priority: "low"
    },
    { 
      from: "Vercel", 
      subject: "Deployment successful", 
      preview: "Your latest project has been deployed successfully.", 
      time: "Mon",
      priority: "low"
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-amber-600 bg-amber-50";
      case "low":
      default:
        return "text-emerald-600 bg-emerald-50";
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
      {emails.map((email, index) => (
        <div
          key={index}
          className="border-b border-slate-100 px-4 py-3 hover:bg-slate-50 transition cursor-pointer flex items-center gap-4"
        >
          <button className="text-lg hover:scale-125 transition">☆</button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{email.from}</p>
            <p className="text-sm text-slate-700 truncate">{email.subject}</p>
          </div>
          <p className="text-sm text-slate-600 truncate hidden md:block flex-1">{email.preview}</p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(email.priority)}`}>
              {email.priority}
            </span>
            <span className="text-xs text-slate-500">{email.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}