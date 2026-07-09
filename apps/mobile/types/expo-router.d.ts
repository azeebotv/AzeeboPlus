// Expo Router type declarations
// This fixes type mismatches for router.replace/navigation in expo-router

declare module 'expo-router' {
  interface LinkProps {
    href: string;
  }

  interface Router {
    replace: (href: string) => void;
    push: (href: string) => void;
    back: () => void;
    navigate: (href: string) => void;
  }
}

// Allow string paths for expo-router navigation
type RelativePathString = `/${string}`;
type ExternalPathString = string;

declare module 'expo-router' {
  export function useRouter(): {
    replace: (href: string) => void;
    push: (href: string) => void;
    back: () => void;
    navigate: (href: string) => void;
  };
}
