export default function AccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFE335] font-body" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 bg-paper p-8 rounded-none shadow-sm border border-ink">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#111111]" aria-hidden="true">progress_activity</span>
        <span className="text-[#111111] font-extrabold tracking-widest uppercase text-xs">Verifying Access...</span>
      </div>
    </div>
  );
}
