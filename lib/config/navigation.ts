export type NavItem = {
  label: string;
  href: string;
  /**
   * Configure how the active state is calculated. Defaults to "startsWith"
   * which works well for list pages that have nested routes.
   */
  match?: "exact" | "startsWith";
};

export const NAVIGATION_ITEMS: NavItem[] = [
  { label: "Articles", href: "/articles" },
  { label: "Case Studies", href: "/case-studies" },
];
