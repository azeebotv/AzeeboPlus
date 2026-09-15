import { useState, useEffect, useCallback } from 'react';
import {
  BiometricAuthService,
  BiometricType,
  BiometricResult,
  BiometricCredentials,
} from '../utils/biometricAuth';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';

interface UseBiometricState {
  isAvailable: boolean;
  biometricType: BiometricType;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBiometric() {
  const { validateSession } = useAuth();
  const [state, setState] = useState<UseBiometricState>({
    isAvailable: false,
    biometricType: 'none',
    isEnabled: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const [available, type, enabled] = await Promise.all([
          BiometricAuthService.isAvailable(),
          BiometricAuthService.getSupportedBiometricType(),
          BiometricAuthService.isBiometricEnabled(),
        ]);

        setState({
          isAvailable: available,
          biometricType: type,
          isEnabled: enabled,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          isAvailable: false,
          biometricType: 'none',
          isEnabled: false,
          isLoading: false,
          error:
            error instanceof Error ? (error as Error).message : 'Failed to initialize biometrics',
        });
      }
    };

    initialize();
  }, []);

  const authenticate = useCallback(async (promptMessage?: string): Promise<BiometricResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const result = await BiometricAuthService.authenticate(promptMessage);

    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: result.success ? null : result.error || null,
    }));

    return result;
  }, []);

  const enableBiometrics = useCallback(
    async (credentials: BiometricCredentials): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const success = await BiometricAuthService.enableBiometrics(credentials);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isEnabled: success,
        error: success ? null : 'Failed to enable biometrics',
      }));

      return success;
    },
    []
  );

  const disableBiometrics = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    await BiometricAuthService.disableBiometrics();

    setState((prev) => ({
      ...prev,
      isLoading: false,
      isEnabled: false,
    }));
  }, []);

  const authenticateWithStoredCredentials = useCallback(async (): Promise<BiometricResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const result = await BiometricAuthService.authenticateWithStoredCredentials();

    if (!result.success) {
      setState((prev) => ({ ...prev, isLoading: false, error: result.error || null }));
      return result;
    }

    // Biometrics only verified a local profile — the stored tokens may still be
    // expired/revoked. Re-validate the session against the API before declaring
    // success; on failure the auth context logs out and the user re-enters
    // their password.
    const sessionValid = await validateSession();
    if (!sessionValid) {
      const failed: BiometricResult = {
        success: false,
        error: 'Your session has expired. Please sign in with your password.',
      };
      setState((prev) => ({ ...prev, isLoading: false, error: failed.error || null }));
      return failed;
    }

    setState((prev) => ({ ...prev, isLoading: false, error: null }));
    return result;
  }, [validateSession]);

  return {
    ...state,
    authenticate,
    enableBiometrics,
    disableBiometrics,
    authenticateWithStoredCredentials,
  };
}
