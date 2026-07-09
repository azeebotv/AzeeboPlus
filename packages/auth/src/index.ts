export { AuthClient, createMemoryAuthClient } from './auth-client';
export type {
  AuthClientConfig,
  AuthApiResponse,
  AuthUser,
  AuthTokens,
  AuthState,
  AuthEvent,
  AuthEventType,
  LoginRequest,
  RegisterRequest,
} from './auth-client';
export type { TokenStorage } from '@azeebo/shared-types';

export { ProtectedRoute, ProtectedAuthProvider, useProtectedAuth } from './web/ProtectedRoute';
export type {
  AuthState as WebAuthState,
  ProtectedAuthProviderProps,
  ProtectedRouteProps,
} from './web/ProtectedRoute';
