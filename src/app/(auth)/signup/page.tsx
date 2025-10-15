/**
 * Signup Page
 *
 * Public route for new user registration
 * Uses SignUpForm component with shadcn/ui design system
 */

import { SignUpForm } from '@/components/auth/SignUpForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Multi-Tenant SaaS',
  description: 'Create a new account and start your journey with our multi-tenant SaaS platform.',
};

export default function SignupPage() {
  return <SignUpForm />;
}
