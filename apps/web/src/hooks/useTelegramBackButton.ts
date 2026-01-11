import { useEffect } from 'react';

/**
 * Hook to manage Telegram WebApp BackButton
 * 
 * @param visible - Whether the back button should be visible
 * @param onClick - Callback to execute when back button is clicked
 * 
 * @example
 * ```tsx
 * useTelegramBackButton(isDrawerOpen, () => {
 *   setIsDrawerOpen(false);
 * });
 * ```
 */
export function useTelegramBackButton(visible: boolean, onClick: () => void): void {
  useEffect(() => {
    // No-op if not in Telegram WebApp
    if (typeof window === 'undefined' || !window.Telegram?.WebApp?.BackButton) {
      return undefined;
    }

    const backButton = window.Telegram.WebApp.BackButton;

    if (visible) {
      // Show back button and set click handler
      backButton.show();
      backButton.onClick(onClick);

      // Cleanup: hide button and remove handler when visibility changes or component unmounts
      return () => {
        backButton.offClick(onClick);
        backButton.hide();
      };
    }

    // If not visible, ensure button is hidden (may have been shown by previous state)
    backButton.hide();
    return undefined;
  }, [visible, onClick]);
}
