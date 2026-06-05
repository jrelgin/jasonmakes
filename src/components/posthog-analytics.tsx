"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

let isInitialized = false;

export default function PostHogAnalytics() {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (!posthogKey || isInitialized) return;

    posthog.init(posthogKey, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: true,
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });

    isInitialized = true;
  }, []);

  return null;
}
