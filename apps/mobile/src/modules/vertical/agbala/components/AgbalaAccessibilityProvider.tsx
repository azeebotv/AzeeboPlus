import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

interface AccessibilitySettings {
  isScreenReaderEnabled: boolean;
  isReducedMotionEnabled: boolean;
  colorContrastLevel: 'normal' | 'high' | 'extra-high';
}

interface AccessibilityContextValue extends AccessibilitySettings {
  setHighContrastEnabled: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  isScreenReaderEnabled: false,
  isReducedMotionEnabled: false,
  colorContrastLevel: 'normal',
  setHighContrastEnabled: () => {},
});

export const useAgbalaAccessibility = () => useContext(AccessibilityContext);

interface AgbalaAccessibilityProviderProps {
  children: ReactNode;
}

export const AgbalaAccessibilityProvider: React.FC<AgbalaAccessibilityProviderProps> = ({
  children,
}) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);

  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
    };

    const checkReduceMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReducedMotionEnabled(enabled);
    };

    checkScreenReader();
    checkReduceMotion();

    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotionEnabled
    );

    return () => {
      screenReaderSubscription?.remove();
      reduceMotionSubscription?.remove();
    };
  }, []);

  const colorContrastLevel: 'normal' | 'high' | 'extra-high' = highContrastEnabled
    ? 'extra-high'
    : 'normal';

  const contextValue: AccessibilityContextValue = {
    isScreenReaderEnabled,
    isReducedMotionEnabled,
    colorContrastLevel,
    setHighContrastEnabled,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>{children}</AccessibilityContext.Provider>
  );
};

export default AgbalaAccessibilityProvider;
