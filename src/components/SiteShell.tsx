"use client";

import { usePathname } from "next/navigation";

import Navigation from "@/components/Navigation";

/**
 * Wraps the site chrome (the scroll-aware nav bar + the top offset that clears
 * it at rest) so it can be skipped on routes that ship their own full-screen
 * UI. The nav hides as you scroll down and glides back in on scroll up, but its
 * resting slot still sits above the content, so the `pt-28` offset reserves that
 * space. Keystatic's admin app renders its own layout, and the site's `z-50` nav
 * would otherwise float on top of the CMS — so we render the page bare there.
 *
 * `children` are passed through from the server layout, so the pages they
 * contain stay server components even though this boundary is a client
 * component.
 */
export default function SiteShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/keystatic") ?? false;

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-[100dvh] pt-28">{children}</div>
    </>
  );
}
