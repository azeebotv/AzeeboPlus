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
  TokenStorage,
} from './auth-client';

export { ProtectedRoute, ProtectedAuthProvider, useProtectedAuth } from './web/ProtectedRoute';
export type {
  AuthState as WebAuthState,
  ProtectedAuthProviderProps,
  ProtectedRouteProps,
} from './web/ProtectedRoute';
