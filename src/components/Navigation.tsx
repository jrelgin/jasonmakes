"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAVIGATION_ITEMS } from "#lib/config/navigation";
import { cn } from "#lib/utils/cn";
import { isNavItemActive } from "#lib/utils/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 py-4",
        isHome
          ? "text-white"
          : "border-b border-gray-200/70 bg-white/90 text-gray-900 backdrop-blur-md dark:border-gray-800/70 dark:bg-gray-950/88 dark:text-gray-100",
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-6 px-4">
        <Link
          href="/"
          aria-label="Jason Makes home"
          className={cn(
            "flex shrink-0 items-center transition-opacity hover:opacity-80",
            isHome &&
              "bg-[#12203A] p-3 shadow-[0_10px_40px_rgba(8,13,22,0.28)]",
          )}
        >
          <Image
            src={isHome ? "/images/logo-white.svg" : "/images/logo-black.svg"}
            alt="Jason Makes"
            width={132}
            height={72}
            priority
            className={cn("h-10 w-auto", !isHome && "dark:invert")}
          />
        </Link>

        <ul
          className={cn(
            "flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm font-semibold uppercase",
            isHome ? "text-white/82" : "text-gray-700 dark:text-gray-300",
          )}
        >
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "transition-colors",
                    isHome
                      ? "hover:text-white"
                      : "hover:text-gray-950 dark:hover:text-white",
                    isActive &&
                      (isHome ? "text-white" : "text-gray-950 dark:text-white"),
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
