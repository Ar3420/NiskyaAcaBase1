"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition-shell">
      <div className="page-transition-sweep" aria-hidden="true" />
      <div className="page-transition-content">{children}</div>
    </div>
  );
}
