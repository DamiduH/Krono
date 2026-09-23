import { getSupabaseAdmin } from "@/lib/supabase";

export interface DomainProgress {
  domain_id: string;
  domain_title: string;
  target_hours: number;
  completed_task_count: number;
  total_video_seconds: number;
}

export async function getDomainProgress(
  userId: string
): Promise<DomainProgress[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("get_domain_progress", {
    user_uuid: userId,
  });

  if (error) {
    throw new Error(`get_domain_progress failed: ${error.message}`);
  }

  return (data ?? []) as DomainProgress[];
}
