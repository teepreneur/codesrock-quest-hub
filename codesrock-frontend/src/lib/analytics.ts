/**
 * Thin wrapper around the globally-loaded PostHog client.
 *
 * PostHog is installed via the HTML snippet in index.html (not the
 * posthog-js npm package), so the client lives on window.posthog.
 * This file gives the rest of the app a typed, safe way to call it
 * without depending on npm/package-lock changes at build time.
 */

declare global {
    interface Window {
          posthog?: {
                  identify: (id: string, properties?: Record<string, unknown>) => void;
                  reset: () => void;
                  capture: (event: string, properties?: Record<string, unknown>) => void;
          };
    }
}

export interface IdentifiableUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    schoolId?: string;
    schoolName?: string;
}

/**
 * Call after a successful login/registration so PostHog ties activity
 * to the actual teacher/admin account instead of an anonymous session.
 */
export function identifyUser(user: IdentifiableUser): void {
    window.posthog?.identify(user.id, {
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(' '),
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.schoolName,
    });
}

/**
 * Call on logout so the next session starts as a fresh anonymous user
 * instead of continuing to be attributed to the previous account.
 */
export function resetIdentity(): void {
    window.posthog?.reset();
}
