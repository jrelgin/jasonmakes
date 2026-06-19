"use client";

import { usePathname } from "next/navigation";

import Navigation from "@/components/Navigation";

/**
 * Wraps the site chrome (fixed navigation + the top offset that clears it) so
 * it can be skipped on routes that ship their own full-screen UI. Keystatic's
 * admin app renders its own layout, and the site's fixed `z-50` nav would
 * otherwise float on top of the CMS — so we render the page bare there.
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
