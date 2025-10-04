export function formatUpdatedAt(isoString: string | null | undefined): string {
  if (!isoString) {
    return "Unknown";
  }

  const parsedDate = new Date(isoString);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
      timeZoneName: "short",
    }).format(parsedDate);
  } catch (error) {
    console.error("Failed to format date in Eastern Time:", error);
    return "Unknown";
  }
}
