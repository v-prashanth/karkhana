// Every API response shape
// Consistent across entire app

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Helper to create responses
export const apiSuccess = <T>(data: T): ApiSuccess<T> => ({
  success: true,
  data,
});

export const apiError = (error: string, code: string): ApiError => ({
  success: false,
  error,
  code,
});
