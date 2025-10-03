"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAVIGATION_TITLE } from "#lib/config/site";
import { NAVIGATION_ITEMS } from "#lib/config/navigation";
import { cn } from "#lib/utils/cn";
import { isNavItemActive } from "#lib/utils/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="py-6 mb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <Link
              href="/"
              className="text-xl font-semibold text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
            >
              {NAVIGATION_TITLE}
            </Link>
          </div>
          <ul className="flex space-x-8">
            {NAVIGATION_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400",
                    isNavItemActive(pathname, item) && "font-medium text-blue-600 dark:text-blue-400",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
