import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface ScreenSize {
  width: number;
  height: number;
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isTablet: boolean;
  isPhone: boolean;
  isWeb: boolean;
  orientation: 'portrait' | 'landscape';
}

export const getScreenSize = (): ScreenSize => {
  const isWeb = Platform.OS === 'web';
  const isTablet = screenWidth >= 768;
  const isPhone = screenWidth < 768;
  const isSmall = screenWidth <= 375;
  const isMedium = screenWidth > 375 && screenWidth <= 768;
  const isLarge = screenWidth > 768;
  const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

  return {
    width: screenWidth,
    height: screenHeight,
    isSmall,
    isMedium,
    isLarge,
    isTablet,
    isPhone,
    isWeb,
    orientation
  };
};

export const responsive = {
  // Responsive spacing
  spacing: {
    xs: (screenWidth <= 375) ? 4 : 8,
    sm: (screenWidth <= 375) ? 8 : 12,
    md: (screenWidth <= 375) ? 12 : 16,
    lg: (screenWidth <= 375) ? 16 : 24,
    xl: (screenWidth <= 375) ? 20 : 32,
  },

  // Responsive font sizes
  fontSize: {
    xs: (screenWidth <= 375) ? 10 : 12,
    sm: (screenWidth <= 375) ? 12 : 14,
    md: (screenWidth <= 375) ? 14 : 16,
    lg: (screenWidth <= 375) ? 16 : 18,
    xl: (screenWidth <= 375) ? 18 : 20,
    xxl: (screenWidth <= 375) ? 20 : 24,
  },

  // Touch target sizes (minimum 44px for iOS, 48px for Android)
  touchTarget: {
    small: Math.max(40, screenWidth <= 375 ? 44 : 48),
    medium: Math.max(44, screenWidth <= 375 ? 48 : 56),
    large: Math.max(48, screenWidth <= 375 ? 56 : 64),
  },

  // Container widths
  container: {
    small: Math.min(screenWidth - 32, 400),
    medium: Math.min(screenWidth - 32, 600),
    large: Math.min(screenWidth - 32, 800),
    full: screenWidth - 32,
  },

  // Grid columns based on screen size
  gridColumns: screenWidth <= 375 ? 2 : screenWidth <= 768 ? 3 : 4,
  
  // Calendar specific responsive values
  calendar: {
    dateItemWidth: screenWidth <= 375 ? 45 : screenWidth <= 768 ? 50 : 60,
    dateItemHeight: screenWidth <= 375 ? 60 : screenWidth <= 768 ? 70 : 80,
    timeSlotHeight: screenWidth <= 375 ? 40 : 50,
    minTouchTarget: 44,
  },

  // Modal sizing
  modal: {
    maxWidth: Math.min(screenWidth - 32, 600),
    maxHeight: screenHeight * 0.9,
    padding: screenWidth <= 375 ? 16 : 24,
  },
};

// Responsive breakpoints
export const breakpoints = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
};

// Check if current screen matches breakpoint
export const isBreakpoint = (breakpoint: keyof typeof breakpoints): boolean => {
  return screenWidth >= breakpoints[breakpoint];
};

// Get responsive value based on screen size
export const getResponsiveValue = <T>(values: {
  phone?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => {
  if (screenWidth >= breakpoints.desktop && values.desktop !== undefined) {
    return values.desktop;
  }
  if (screenWidth >= breakpoints.tablet && values.tablet !== undefined) {
    return values.tablet;
  }
  if (values.phone !== undefined) {
    return values.phone;
  }
  return values.default;
};

// Dynamic styles based on screen size
export const createResponsiveStyles = (baseStyles: any) => {
  const screenSize = getScreenSize();
  
  return {
    ...baseStyles,
    // Apply mobile-specific overrides
    ...(screenSize.isPhone && baseStyles.mobile),
    ...(screenSize.isTablet && baseStyles.tablet),
    ...(screenSize.isWeb && baseStyles.web),
  };
};

// Utility for creating flexible layouts
export const flexLayout = {
  // Responsive flex direction
  direction: getResponsiveValue({
    phone: 'column' as const,
    tablet: 'row' as const,
    default: 'row' as const,
  }),
  
  // Responsive wrap
  wrap: getResponsiveValue({
    phone: 'wrap' as const,
    tablet: 'nowrap' as const,
    default: 'nowrap' as const,
  }),
};

// Safe area handling for different devices
export const safeArea = {
  top: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 24 : 0,
  bottom: Platform.OS === 'ios' ? 34 : 0,
  horizontal: 16,
};

// Keyboard handling
export const keyboard = {
  // Reduce modal height when keyboard is visible
  getModalHeightWithKeyboard: (keyboardHeight: number) => {
    return Math.max(screenHeight * 0.4, screenHeight - keyboardHeight - 100);
  },
};

export default responsive;