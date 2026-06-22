// Azeebo Shared Types additional exports
// These are exports needed by the mobile app but not yet in shared-types

declare module '@azeebo/shared-types' {
  export interface Logger {
    log: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, trace?: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
    debug: (message: string, context?: Record<string, unknown>) => void;
  }
}

// Stripe types for expo-payments-stripe
declare module 'expo-payments-stripe' {
  import { ComponentType, ReactNode } from 'react';

  export const StripeProvider: ComponentType<{
    publishableKey: string;
    merchantIdentifier?: string;
    children?: ReactNode;
  }>;

  export interface PaymentMethod {
    id: string;
    type: string;
  }

  export interface CardField {
    focus: () => void;
    blur: () => void;
  }
}