"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type TransitionPhase = "idle" | "covering" | "revealing";

export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const pendingHref = useRef<string | null>(null);
  const previousPathname = useRef(pathname);
  const navigationTimer = useRef<number | null>(null);
  const revealTimer = useRef<number | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (destination.origin !== current.origin) return;
      if (destination.pathname === current.pathname) return;

      event.preventDefault();
      pendingHref.current = `${destination.pathname}${destination.search}${destination.hash}`;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(pendingHref.current);
        pendingHref.current = null;
        return;
      }

      setPhase("covering");

      if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
      navigationTimer.current = window.setTimeout(() => {
        if (pendingHref.current) router.push(pendingHref.current);
      }, 210);
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (navigationTimer.current) window.clearTimeout(navigationTimer.current);
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
    };
  }, [router]);

  useEffect(() => {
    if (pathname === previousPathname.current) return;

    previousPathname.current = pathname;
    if (phase !== "covering") return;

    setPhase("revealing");
    pendingHref.current = null;
    if (revealTimer.current) window.clearTimeout(revealTimer.current);
    revealTimer.current = window.setTimeout(() => setPhase("idle"), 240);
  }, [pathname, phase]);

  return (
    <div className="page-transition-shell">
      <div className={`page-transition-sweep page-transition-sweep-${phase}`} aria-hidden="true" />
      <div key={pathname} className="page-transition-content">{children}</div>
    </div>
  );
}
