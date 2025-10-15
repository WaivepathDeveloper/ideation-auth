/**
 * Login Page
 *
 * Public route for user authentication
 * Uses SignInForm component with shadcn/ui design system
 */

import { SignInForm } from '@/components/auth/SignInForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Multi-Tenant SaaS',
  description: 'Sign in to your account to access your dashboard and manage your tenant.',
};

export default function LoginPage() {
  return <SignInForm />;
}
