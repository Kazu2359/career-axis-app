"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/axis/card", label: "軸カード" },
  { href: "/selections", label: "選考プロセス" },
  { href: "/board", label: "進捗ボード" },
  { href: "/industries", label: "業界マップ" },
  { href: "/positions", label: "職種マップ" },
  { href: "/schedules", label: "スケジュール" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between gap-1 border-b border-border pb-3 text-sm">
      <div className="flex flex-wrap gap-1">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                "rounded-full px-3 py-1.5 transition-colors " +
                (active
                  ? "bg-accent-soft font-medium text-foreground"
                  : "text-muted hover:text-foreground")
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={handleLogout}
        className="shrink-0 rounded-full px-3 py-1.5 text-muted transition-colors hover:text-foreground"
      >
        ログアウト
      </button>
    </nav>
  );
}
