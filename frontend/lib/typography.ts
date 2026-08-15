/**
 * Dynamically adjust font size classes based on balance value length
 * Prevents overflow on display for large monetary values
 * @param balance The numerical balance value
 * @param baseClass The base font size class for normal balances
 * @returns Tailwind font size class string
 */
export const getBalanceFontSize = (balance: number, baseClass: string = 'text-3xl sm:text-4xl lg:text-5xl'): string => {
  // Format the balance to get a sense of its display length
  const displayString = `$${balance.toFixed(2)}`;
  
  // Define font size breakpoints based on display length
  // The goal is to keep the balance readable without overflow
  
  if (displayString.length <= 7) {
    // e.g., "$100.00" - Normal display
    return baseClass;
  } else if (displayString.length <= 9) {
    // e.g., "$1000.00" - Slightly reduce
    return 'text-2xl sm:text-3xl lg:text-4xl';
  } else if (displayString.length <= 11) {
    // e.g., "$10000.00" - Further reduce
    return 'text-xl sm:text-2xl lg:text-3xl';
  } else if (displayString.length <= 13) {
    // e.g., "$100000.00" - Significantly reduce
    return 'text-lg sm:text-xl lg:text-2xl';
  } else {
    // e.g., "$1000000.00" or larger - Minimum readable size
    return 'text-base sm:text-lg lg:text-xl';
  }
};

/**
 * Get dynamic font size for various balance display contexts
 * @param balance The numerical balance value
 * @param context The type of display context (card, header, profile, etc.)
 * @returns Tailwind font size class string
 */
export const getBalanceFontSizeByContext = (balance: number, context: 'card' | 'header' | 'profile' | 'wallet' = 'card'): string => {
  const displayString = `${balance.toFixed(2)}`;
  
  const baseClasses = {
    card: 'text-2xl sm:text-3xl lg:text-4xl',
    header: 'text-3xl sm:text-4xl lg:text-5xl',
    profile: 'text-lg sm:text-xl lg:text-2xl',
    wallet: 'text-2xl sm:text-3xl lg:text-4xl',
  };
  
  const selectedBase = baseClasses[context];
  
  if (displayString.length <= 6) {
    return selectedBase;
  } else if (displayString.length <= 8) {
    return selectedBase.replace(/text-\d+xl/g, (match) => {
      const sizes = { 'text-2xl': 'text-xl', 'text-3xl': 'text-2xl', 'text-4xl': 'text-3xl', 'text-5xl': 'text-4xl' };
      return sizes[match as keyof typeof sizes] || match;
    });
  } else {
    // For very large balances, reduce more aggressively
    return selectedBase.replace(/text-\d+xl/g, (match) => {
      const sizes = { 'text-2xl': 'text-base', 'text-3xl': 'text-xl', 'text-4xl': 'text-2xl', 'text-5xl': 'text-3xl' };
      return sizes[match as keyof typeof sizes] || match;
    });
  }
};

/**
 * Generate inline style for dynamic font sizing (alternative to Tailwind)
 * Useful when Tailwind classes aren't flexible enough
 * @param balance The numerical balance value
 * @param minFontSize Minimum font size in pixels
 * @param maxFontSize Maximum font size in pixels
 * @returns Inline style object with font size
 */
export const getBalanceFontSizeStyle = (
  balance: number,
  minFontSize: number = 14,
  maxFontSize: number = 48
): React.CSSProperties => {
  const displayString = `${balance.toFixed(2)}`;
  const length = displayString.length;
  
  // Calculate responsive font size based on length
  // Formula: decrease by 2px for each character over 6
  const reductionPerChar = 2;
  const baseSize = maxFontSize;
  const calculatedSize = Math.max(minFontSize, baseSize - (Math.max(0, length - 6) * reductionPerChar));
  
  return {
    fontSize: `${calculatedSize}px`,
    lineHeight: '1.2',
  };
};
