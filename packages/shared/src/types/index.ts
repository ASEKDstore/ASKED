// Common types for the monorepo
export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};











