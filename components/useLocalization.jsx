import { useTheme } from './ui/Theme';
import { toast as sonnerToast } from 'sonner';

/**
 * Provides localization and common UI utilities.
 * A wrapper around the ThemeContext for easier access to translations.
 */
export const useLocalization = () => {
  const { t, language } = useTheme();

  return {
    L: t, // Alias for the main translation object
    isRTL: language === 'ar',
    language,
    sonnerToast, // Re-exporting the toast function for convenience
  };
};