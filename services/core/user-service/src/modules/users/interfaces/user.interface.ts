export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatar?: string | null;
  role: string;
  preferences?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
