import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

/**
 * Critical Cloud Function: Auto-assign tenant_id and role on user creation
 *
 * Flow:
 * 1. Check if user was invited
 * 2. If invited -> Join existing tenant
 * 3. If NOT invited -> Create new tenant, make user admin
 * 4. Set custom claims (tenant_id, role)
 * 5. Create user profile document
 * 6. Create audit log
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email } = user;

  if (!email) {
    console.error(`User ${uid} created without email`);
    throw new Error('User must have an email address');
  }

  console.log(`Processing new user: ${email} (${uid})`);

  try {
    // Step 1: Check for pending invitation
    const inviteSnapshot = await db.collection('invitations')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    let tenant_id: string;
    let role: 'tenant_admin' | 'user';

    if (!inviteSnapshot.empty) {
      // User was invited - join existing tenant
      const invite = inviteSnapshot.docs[0].data();
      tenant_id = invite.tenant_id;
      role = invite.role as 'tenant_admin' | 'user';

      console.log(`User ${email} joining existing tenant ${tenant_id} as ${role}`);

      // Mark invitation as accepted
      await inviteSnapshot.docs[0].ref.update({
        status: 'accepted',
        user_id: uid,
        accepted_at: FieldValue.serverTimestamp()
      });
    } else {
      // New user - create new tenant
      tenant_id = db.collection('tenants').doc().id;
      role = 'tenant_admin';

      console.log(`Creating new tenant ${tenant_id} for user ${email}`);

      // Create tenant document
      await db.collection('tenants').doc(tenant_id).set({
        name: `${email.split('@')[0]}'s Organization`,
        created_by: uid,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
        status: 'active',
        settings: {
          max_users: 50,
          features: ['basic'],
          subscription_plan: 'free',
          billing_email: email
        },
        metadata: {
          industry: '',
          company_size: ''
        }
      });
    }

    // Step 2: Set custom claims (CRITICAL for security)
    await admin.auth().setCustomUserClaims(uid, { tenant_id, role });
    console.log(`Custom claims set for ${email}: tenant_id=${tenant_id}, role=${role}`);

    // Step 3: Create user profile document
    await db.collection('users').doc(uid).set({
      tenant_id,
      email,
      display_name: user.displayName || email.split('@')[0],
      role,
      status: 'active',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
      last_login: FieldValue.serverTimestamp(),
      profile: {
        avatar_url: user.photoURL || '',
        phone: user.phoneNumber || '',
        timezone: ''
      },
      preferences: {
        notifications: true,
        language: 'en'
      }
    });

    // Step 4: Create audit log
    await db.collection('audit_logs').add({
      tenant_id,
      user_id: uid,
      action: 'USER_CREATED',
      collection: 'users',
      document_id: uid,
      timestamp: FieldValue.serverTimestamp(),
      changes: {
        role,
        status: 'active',
        email
      }
    });

    console.log(`Successfully created user ${email} in tenant ${tenant_id}`);
  } catch (error) {
    console.error(`Error creating user ${email}:`, error);
    throw error;
  }
});
