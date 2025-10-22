'use client';

/**
 * ViewToggle Component
 *
 * Toggle between "Users" and "Roles" views in the settings page
 *
 * Features:
 * - Single selection mode (radio behavior)
 * - Icon + label layout
 * - Design token styling
 * - Accessible ARIA labels
 */

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Users, Shield } from 'lucide-react';

/**
 * ViewToggle component props
 */
export interface ViewToggleProps {
  /** Current selected view */
  value: 'users' | 'roles';
  /** Callback when view changes */
  onChange: (value: 'users' | 'roles') => void;
}

/**
 * ViewToggle component
 *
 * Toggle between Users and Roles views
 */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(newValue) => {
        // Prevent deselecting the current view
        if (newValue) {
          onChange(newValue as 'users' | 'roles');
        }
      }}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem
        value="users"
        aria-label="View users"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <Users className="h-4 w-4 mr-2" />
        <span>Users</span>
      </ToggleGroupItem>

      <ToggleGroupItem
        value="roles"
        aria-label="View roles"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <Shield className="h-4 w-4 mr-2" />
        <span>Roles</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
