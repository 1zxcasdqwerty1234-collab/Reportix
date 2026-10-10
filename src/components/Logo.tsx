interface LogoProps {
  size?: "sm" | "default" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "default", showText = true, className = "" }: LogoProps) {
  const imgSize = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const textSize = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";

  return (
    <span className={`inline-flex items-center gap-2.5 font-semibold tracking-tight ${className}`}>
      <span className="relative flex items-center justify-center">
        {/* Silver glowing halo */}
        <span className="pointer-events-none absolute -inset-1 rounded-xl bg-gradient-to-r from-zinc-300/40 via-white/50 to-zinc-400/40 opacity-70 blur-md animate-pulse" />
        <img
          src="/logo.png"
          alt="Reportix"
          className={`relative ${imgSize} rounded-md object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] transition-all duration-300 hover:drop-shadow-[0_0_18px_rgba(255,255,255,0.9)]`}
        />
      </span>
      {showText && (
        <span
          className={`bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text font-bold tracking-tight text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.25)] ${textSize}`}
        >
          Reportix
        </span>
      )}
    </span>
  );
}
