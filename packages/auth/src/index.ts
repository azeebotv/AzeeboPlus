export { AuthClient, createMemoryAuthClient } from './auth-client.js';
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
} from './auth-client.js';
export type { TokenStorage } from '@azeebo/shared-types';

export { ProtectedRoute, ProtectedAuthProvider, useProtectedAuth } from './web/ProtectedRoute.js';
export type {
  AuthState as WebAuthState,
  ProtectedAuthProviderProps,
  ProtectedRouteProps,
} from './web/ProtectedRoute.js';
