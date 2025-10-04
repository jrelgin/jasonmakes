export function formatUpdatedAt(isoString: string | null | undefined): string {
  if (!isoString) {
    return "Unknown";
  }

  const parsedDate = new Date(isoString);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}
