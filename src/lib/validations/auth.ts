import { z } from 'zod';

/**
 * Sign In Validation Schema
 *
 * Validates user sign-in credentials with:
 * - Email format validation
 * - Password required (no strength validation for login)
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

/**
 * Sign Up Validation Schema
 *
 * Validates user registration with:
 * - Email format validation
 * - Password strength requirements (min 6 chars, uppercase, lowercase, number)
 * - Password confirmation matching
 */
export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * Firebase Error Mapper
 *
 * Converts Firebase auth error codes to user-friendly messages
 */
export function mapFirebaseError(err: { code?: string; message?: string }): string {
  switch (err.code) {
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    default:
      return err.message || 'An error occurred';
  }
}
