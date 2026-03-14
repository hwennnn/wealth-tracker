import { supabase } from "@/integrations/supabase/client";

const MIGRATION_KEY = "wealth_clerk_migration_done";

/**
 * Migrate existing Supabase user data to a new Clerk user ID.
 * Only runs once per browser (tracked via localStorage).
 */
export async function migrateUserData(clerkUserId: string): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) return;

  // Find all distinct user_ids in categories that aren't the current Clerk ID
  const { data: categories } = await supabase
    .from("categories")
    .select("user_id")
    .neq("user_id", clerkUserId)
    .limit(1);

  if (!categories || categories.length === 0) {
    localStorage.setItem(MIGRATION_KEY, "true");
    return;
  }

  const oldUserId = categories[0].user_id;

  // Migrate categories
  await supabase
    .from("categories")
    .update({ user_id: clerkUserId })
    .eq("user_id", oldUserId);

  // Migrate entries
  await supabase
    .from("entries")
    .update({ user_id: clerkUserId })
    .eq("user_id", oldUserId);

  // Migrate profile
  await supabase
    .from("profiles")
    .update({ id: clerkUserId })
    .eq("id", oldUserId);

  localStorage.setItem(MIGRATION_KEY, "true");
  console.log(`Migrated data from ${oldUserId} to ${clerkUserId}`);
}
