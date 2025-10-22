'use client';

/**
 * SettingsTabs Component
 *
 * Tab navigation for settings page with three tabs:
 * - AI Configuration (placeholder)
 * - User Permissions (active content)
 * - Notifications (placeholder)
 *
 * Features:
 * - Default tab selection
 * - Placeholder content for unimplemented tabs
 * - Children prop for User Permissions content
 * - Design token styling
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ComingSoonPlaceholder } from '@/components/ui/ComingSoonPlaceholder';

/**
 * SettingsTabs component props
 */
export interface SettingsTabsProps {
  /** Default active tab */
  defaultTab?: string;
  /** Content for User Permissions tab */
  children: React.ReactNode;
}

/**
 * SettingsTabs component
 *
 * Tabbed navigation for settings sections
 */
export function SettingsTabs({ defaultTab = 'user-permissions', children }: SettingsTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="bg-muted">
        <TabsTrigger value="ai-config">
          AI Configuration
        </TabsTrigger>
        <TabsTrigger value="user-permissions">
          User Permissions
        </TabsTrigger>
        <TabsTrigger value="notifications">
          Notifications
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="ai-config">
          <ComingSoonPlaceholder message="AI Configuration features are under development and will be available soon." />
        </TabsContent>

        <TabsContent value="user-permissions">
          {children}
        </TabsContent>

        <TabsContent value="notifications">
          <ComingSoonPlaceholder message="Notification settings are under development and will be available soon." />
        </TabsContent>
      </div>
    </Tabs>
  );
}
