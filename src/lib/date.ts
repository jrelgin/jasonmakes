export function formatPublishDate(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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
