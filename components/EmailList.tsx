export default function EmailList() {
  const emails = [
    { from: "Google", subject: "Welcome to Gmail App", preview: "Thanks for trying your first Next.js Gmail UI.", time: "10:30 AM" },
    { from: "OpenAI", subject: "Your project update", preview: "Your app is running successfully on localhost:3000.", time: "9:15 AM" },
    { from: "GitHub", subject: "New login detected", preview: "We noticed a new sign in to your account.", time: "Yesterday" },
    { from: "Vercel", subject: "Deployment successful", preview: "Your latest project has been deployed successfully.", time: "Mon" },
  ];

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {emails.map((email, index) => (
        <div
          key={index}
          style={{
            display: "grid",
            gridTemplateColumns: "40px 160px 220px 1fr 100px",
            padding: "14px 16px",
            borderBottom: "1px solid #eee",
          }}
        >
          <span>☆</span>
          <strong>{email.from}</strong>
          <span>{email.subject}</span>
          <span style={{ color: "#5f6368" }}>{email.preview}</span>
          <span style={{ textAlign: "right", color: "#5f6368" }}>{email.time}</span>
        </div>
      ))}
    </div>
  );
}