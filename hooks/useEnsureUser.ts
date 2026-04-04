import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { api } from "../convex/_generated/api";

/**
 * Ensures a Convex user record exists for the current authenticated session.
 * Runs once on mount when authenticated. New users default to "diner" role.
 * Staff role is assigned by admins via addMember.
 */
export function useEnsureUser() {
  const ensureUser = useMutation(api.users.ensureUser);
  const { user } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (called.current) return;
    called.current = true;

    ensureUser({
      role: "diner",
      email: user.email ?? undefined,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
    }).catch(console.error);
  }, [user, ensureUser]);
}
