export default function SearchBar() {
  return (
    <div
      style={{
        backgroundColor: "#eaf1fb",
        padding: "14px 20px",
        borderRadius: "24px",
        marginBottom: "16px",
      }}
    >
      <input
        type="text"
        placeholder="Search mail"
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          backgroundColor: "transparent",
          fontSize: "18px",
        }}
      />
    </div>
  );
}