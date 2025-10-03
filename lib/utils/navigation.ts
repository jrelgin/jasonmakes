import type { NavItem } from "#lib/config/navigation";

export function isNavItemActive(
  pathname: string | null,
  item: NavItem,
): boolean {
  if (!pathname) {
    return false;
  }

  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname.startsWith(item.href);
}
