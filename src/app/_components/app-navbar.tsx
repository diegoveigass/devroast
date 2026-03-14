import Link from "next/link";

export function AppNavbar() {
  return (
    <header className="border-b border-border-primary bg-bg-page">
      <div className="flex h-14 w-full items-center justify-between px-6 lg:px-10">
        <Link
          className="flex items-center gap-2 font-mono text-sm text-text-primary transition-colors hover:text-accent-green"
          href="/"
        >
          <span className="text-accent-green">{">"}</span>
          <span>devroast</span>
        </Link>

        <nav className="flex items-center gap-6 font-mono text-xs text-text-secondary">
          <Link
            className="transition-colors hover:text-text-primary"
            href="/components"
          >
            components
          </Link>
          <Link
            className="transition-colors hover:text-text-primary"
            href="/leaderboard"
          >
            leaderboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
