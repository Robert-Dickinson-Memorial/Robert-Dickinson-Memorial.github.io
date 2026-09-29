"use client";

import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

export default function ContributionLink({
  href,
  route,
  className,
  children,
}: {
  href: string;
  route: string;
  className?: string;
  children: ReactNode;
}) {
  return <a
    className={className}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    data-contribution-route={route}
    onClick={() => {
      window.sessionStorage.setItem("livingTributeRoute", route);
      window.dispatchEvent(new CustomEvent("livingTributeRouteSelected", { detail: route }));
    }}
  >
    {children} <ExternalLink size={14} aria-hidden="true" />
  </a>;
}
