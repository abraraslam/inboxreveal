export default function Sidebar() {
  return (
    <aside
      style={{
        width: "260px",
        padding: "16px 12px",
        backgroundColor: "#f6f8fc",
      }}
    >
      <h2 style={{ margin: "8px 0 20px 4px", fontSize: "28px", color: "#d93025" }}>
        Gmail
      </h2>

      <button
        style={{
          padding: "16px 24px",
          borderRadius: "16px",
          border: "none",
          backgroundColor: "#c2e7ff",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "24px",
        }}
      >
        ✏️ Compose
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ padding: "10px 14px", borderRadius: "20px", backgroundColor: "#d3e3fd", fontWeight: "bold" }}>
          Inbox
        </div>
        <div style={{ padding: "10px 14px", borderRadius: "20px" }}>Starred</div>
        <div style={{ padding: "10px 14px", borderRadius: "20px" }}>Snoozed</div>
        <div style={{ padding: "10px 14px", borderRadius: "20px" }}>Sent</div>
        <div style={{ padding: "10px 14px", borderRadius: "20px" }}>Drafts</div>
      </div>
    </aside>
  );
}