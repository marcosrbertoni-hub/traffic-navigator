import { Link } from "@tanstack/react-router";
import { BRAND } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string; to?: "/" | "/app" | "/admin" }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2 font-display text-lg font-semibold", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-brand shadow-glow">
        <svg viewBox="0 0 24 24" className="size-4 text-ink" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path d="M4 18 L10 6 L14 14 L20 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {BRAND.name}
    </Link>
  );
}
