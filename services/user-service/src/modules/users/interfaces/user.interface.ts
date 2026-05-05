export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string | null;
  role: string;
  preferences?: any;
  createdAt: Date;
  updatedAt: Date;
}
