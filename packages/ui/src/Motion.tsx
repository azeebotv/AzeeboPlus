import React, { useState, useEffect, useRef, useCallback } from 'react';

export type AnimationType = 
  | 'fadeIn' 
  | 'fadeOut' 
  | 'slideUp' 
  | 'slideDown' 
  | 'slideLeft' 
  | 'slideRight' 
  | 'scaleIn' 
  | 'scaleOut' 
  | 'bounceIn';

export type AnimationDirection = 'in' | 'out';

export interface MotionProps {
  children: React.ReactNode;
  animate?: AnimationType;
  initial?: boolean;
  delay?: number;
  duration?: number;
  className?: string;
  onAnimationComplete?: () => void;
}

export function Motion({ 
  children, 
  animate = 'fadeIn', 
  initial = true, 
  delay = 0, 
  duration = 300,
  className = '',
  onAnimationComplete 
}: MotionProps): React.ReactElement {
  const [isAnimating, setIsAnimating] = useState(initial);
  
  useEffect(() => {
    if (!initial) {
      setIsAnimating(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [initial, delay]);

  useEffect(() => {
    if (isAnimating && onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, duration, onAnimationComplete]);

  const animationClasses: Record<AnimationType, string> = {
    fadeIn: 'animate-fade-in',
    fadeOut: 'animate-fade-out',
    slideUp: 'animate-slide-up',
    slideDown: 'animate-slide-down',
    slideLeft: 'animate-slide-left',
    slideRight: 'animate-slide-right',
    scaleIn: 'animate-scale-in',
    scaleOut: 'animate-scale-out',
    bounceIn: 'animate-bounce-in',
  };

  return (
    <div className={`${animationClasses[animate]} ${isAnimating ? '' : 'opacity-0'} ${className}`}>
      {children}
    </div>
  );
}

export interface AnimatePresenceProps {
  children: React.ReactNode;
  mode?: 'wait' | 'popLayout' | 'popRemove';
}

export function AnimatePresence({ children, mode = 'popRemove' }: AnimatePresenceProps): React.ReactElement {
  return (
    <div className={`animate-presence-${mode}`}>
      {children}
    </div>
  );
}

export interface FadeProps {
  children: React.ReactNode;
  in: boolean;
  timeout?: number;
  className?: string;
}

export function Fade({ children, in: isIn, timeout = 300, className = '' }: FadeProps): React.ReactElement {
  return (
    <Motion
      animate={isIn ? 'fadeIn' : 'fadeOut'}
      initial={isIn}
      duration={timeout}
      className={className}
    >
      {children}
    </Motion>
  );
}

export interface SlideProps {
  children: React.ReactNode;
  in: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  timeout?: number;
  className?: string;
}

export function Slide({ 
  children, 
  in: isIn, 
  direction = 'up', 
  timeout = 300,
  className = '' 
}: SlideProps): React.ReactElement {
  const animationMap: Record<string, AnimationType> = {
    up: isIn ? 'slideUp' : 'slideDown',
    down: isIn ? 'slideDown' : 'slideUp',
    left: isIn ? 'slideLeft' : 'slideRight',
    right: isIn ? 'slideRight' : 'slideLeft',
  };

  return (
    <Motion
      animate={animationMap[direction]}
      initial={isIn}
      duration={timeout}
      className={className}
    >
      {children}
    </Motion>
  );
}

export interface ScaleProps {
  children: React.ReactNode;
  in: boolean;
  timeout?: number;
  className?: string;
}

export function Scale({ children, in: isIn, timeout = 300, className = '' }: ScaleProps): React.ReactElement {
  return (
    <Motion
      animate={isIn ? 'scaleIn' : 'scaleOut'}
      initial={isIn}
      duration={timeout}
      className={className}
    >
      {children}
    </Motion>
  );
}

export interface BounceProps {
  children: React.ReactNode;
  in: boolean;
  timeout?: number;
  className?: string;
}

export function Bounce({ children, in: isIn, timeout = 500, className = '' }: BounceProps): React.ReactElement {
  return (
    <Motion
      animate={isIn ? 'bounceIn' : 'fadeOut'}
      initial={isIn}
      duration={timeout}
      className={className}
    >
      {children}
    </Motion>
  );
}

export interface useAnimatedNumberProps {
  from: number;
  to: number;
  duration?: number;
  easing?: (t: number) => number;
}

export function useAnimatedNumber({ 
  from, 
  to, 
  duration = 500, 
  easing = easeOutCubic 
}: useAnimatedNumberProps): number {
  const [value, setValue] = useState(from);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    setValue(from);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      
      const currentValue = from + (to - from) * easedProgress;
      setValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [from, to, duration, easing]);

  return value;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

export interface useCountdownProps {
  targetDate: Date;
  autoStart?: boolean;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown({ targetDate, autoStart = true }: useCountdownProps): CountdownTime {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const intervalRef = useRef<number | null>(null);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [targetDate]);

  useEffect(() => {
    if (autoStart) {
      setTimeLeft(calculateTimeLeft());
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoStart, calculateTimeLeft]);

  return timeLeft;
}

export interface useHoverProps {
  delay?: number;
}

export function useHover({ delay = 150 }: useHoverProps = {}): {
  isHovered: boolean;
  bind: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
} {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => {
      setIsHovered(true);
    }, delay);
  }, [delay]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(false);
  }, []);

  return {
    isHovered,
    bind: { onMouseEnter, onMouseLeave },
  };
}

export interface useFocusRingProps {
  enabled?: boolean;
}

export function useFocusRing({ enabled = true }: useFocusRingProps = {}): {
  isFocused: boolean;
  bind: {
    onFocus: () => void;
    onBlur: () => void;
  };
} {
  const [isFocused, setIsFocused] = useState(false);

  const onFocus = useCallback(() => {
    if (enabled) {
      setIsFocused(true);
    }
  }, [enabled]);

  const onBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return {
    isFocused,
    bind: { onFocus, onBlur },
  };
}