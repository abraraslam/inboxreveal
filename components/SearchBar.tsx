export default function SearchBar() {
  return (
    <div className="mb-4 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-xl blur-lg group-hover:blur-xl transition"></div>
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl border border-blue-200 shadow-sm">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search mail, subjects, content..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-500"
          />
        </div>
      </div>
    </div>
  );
}