export default function BifurcationBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {/* Blue wash — top half (mobile) / left half (desktop) */}
      <div className="absolute top-0 left-0 w-full h-1/2 md:w-1/2 md:h-full bg-blue-500/[0.015]" />

      {/* Orange wash — bottom half (mobile) / right half (desktop) */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 md:bottom-auto md:top-0 md:left-1/2 md:w-1/2 md:h-full bg-orange-500/[0.015]" />

      {/* Center split line */}
      <div
        className="absolute left-0 right-0 top-1/2 h-px
          md:top-0 md:bottom-0 md:left-1/2 md:right-auto md:w-px md:h-full
          bg-zinc-600/20"
      />
    </div>
  );
}
