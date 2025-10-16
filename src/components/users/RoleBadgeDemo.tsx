/**
 * RoleBadge Demo Component
 *
 * This file demonstrates all RoleBadge variants and sizes.
 * Use this as a visual reference for styling and testing.
 *
 * To use this demo:
 * 1. Import in any page: import { RoleBadgeDemo } from '@/components/users/RoleBadgeDemo';
 * 2. Render: <RoleBadgeDemo />
 */

import { RoleBadge } from './RoleBadge';
import type { UserRole } from '@/types/roles';

const roles: UserRole[] = ['owner', 'admin', 'member', 'guest', 'viewer'];

export function RoleBadgeDemo() {
  return (
    <div className="p-8 space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Role Badge Variants</h2>
        <p className="text-muted-foreground mb-4">
          All role badges with default size (md) and icons
        </p>
        <div className="flex flex-wrap gap-4">
          {roles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Size Variants</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Small (sm)</h3>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <RoleBadge key={role} role={role} size="sm" />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Medium (md) - Default</h3>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <RoleBadge key={role} role={role} size="md" />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Large (lg)</h3>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <RoleBadge key={role} role={role} size="lg" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Without Icons</h2>
        <div className="flex flex-wrap gap-4">
          {roles.map((role) => (
            <RoleBadge key={role} role={role} showIcon={false} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">In Context (User List)</h2>
        <div className="bg-card rounded-lg border p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">Alice Johnson</td>
                <td className="p-2 text-muted-foreground">alice@company.com</td>
                <td className="p-2">
                  <RoleBadge role="owner" size="sm" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Bob Smith</td>
                <td className="p-2 text-muted-foreground">bob@company.com</td>
                <td className="p-2">
                  <RoleBadge role="admin" size="sm" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2">Carol Davis</td>
                <td className="p-2 text-muted-foreground">carol@company.com</td>
                <td className="p-2">
                  <RoleBadge role="member" size="sm" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2">David Wilson</td>
                <td className="p-2 text-muted-foreground">david@guest.com</td>
                <td className="p-2">
                  <RoleBadge role="guest" size="sm" />
                </td>
              </tr>
              <tr>
                <td className="p-2">Emma Brown</td>
                <td className="p-2 text-muted-foreground">emma@viewer.com</td>
                <td className="p-2">
                  <RoleBadge role="viewer" size="sm" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Design Token Reference</h2>
        <div className="bg-card rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-4">
            <RoleBadge role="owner" size="sm" />
            <span className="text-muted-foreground">→ Uses <code>--primary</code> token</span>
          </div>
          <div className="flex items-center gap-4">
            <RoleBadge role="admin" size="sm" />
            <span className="text-muted-foreground">→ Uses <code>--secondary</code> token</span>
          </div>
          <div className="flex items-center gap-4">
            <RoleBadge role="member" size="sm" />
            <span className="text-muted-foreground">→ Uses <code>--success</code> token</span>
          </div>
          <div className="flex items-center gap-4">
            <RoleBadge role="guest" size="sm" />
            <span className="text-muted-foreground">→ Uses <code>--warning</code> token</span>
          </div>
          <div className="flex items-center gap-4">
            <RoleBadge role="viewer" size="sm" />
            <span className="text-muted-foreground">→ Uses <code>--muted</code> token</span>
          </div>
        </div>
      </section>
    </div>
  );
}
