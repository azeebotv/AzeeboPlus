// Stripe types for expo-payments-stripe
declare module 'expo-payments-stripe' {
  import { ComponentType, ReactNode } from 'react';

  export const StripeProvider: ComponentType<{
    publishableKey: string;
    merchantIdentifier?: string;
    children: ReactNode;
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
