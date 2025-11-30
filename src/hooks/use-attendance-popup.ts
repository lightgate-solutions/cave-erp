/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
"use client";

import { useEffect, useState } from "react";
import {
  isWithinSignInWindow,
  shouldShowPopup as checkShouldShowPopup,
} from "@/lib/attendance-utils";

interface UseAttendancePopupProps {
  hasSignedInToday: boolean;
  isLoading?: boolean;
}

interface UseAttendancePopupReturn {
  isOpen: boolean;
  canSignIn: boolean;
  timeWindowMessage: string;
  closePopup: () => void;
  openPopup: () => void;
}

/**
 * Hook to manage attendance sign-in pop-up state
 */
export function useAttendancePopup({
  hasSignedInToday,
  isLoading = false,
}: UseAttendancePopupProps): UseAttendancePopupReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [canSignIn, setCanSignIn] = useState(false);
  const [timeWindowMessage, setTimeWindowMessage] = useState("");

  // Check if pop-up should show on mount and when dependencies change
  useEffect(() => {
    if (isLoading) return;

    const shouldShow = checkShouldShowPopup(hasSignedInToday);
    setIsOpen(shouldShow);

    // Update time window state
    updateTimeWindow();

    // Set up interval to check time window every minute
    const interval = setInterval(updateTimeWindow, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [hasSignedInToday, isLoading]);

  function updateTimeWindow() {
    const withinWindow = isWithinSignInWindow();
    setCanSignIn(withinWindow);

    const now = new Date();
    const hours = now.getHours();

    if (hours < 6) {
      setTimeWindowMessage("Sign-in opens at 6:00 AM");
    } else if (hours >= 9) {
      setTimeWindowMessage("Sign-in window closed (6:00 AM - 9:00 AM)");
    } else {
      setTimeWindowMessage("Sign-in available now");
    }
  }

  const closePopup = () => {
    setIsOpen(false);
  };

  const openPopup = () => {
    setIsOpen(true);
  };

  return {
    isOpen,
    canSignIn,
    timeWindowMessage,
    closePopup,
    openPopup,
  };
}
