// Server-only. Tracks per-user token usage per billing period.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const MONTHLY_TOKEN_CAP = 2_500_000;

export type Period = { start: Date; end: Date };

// Compute the current billing period from the subscription period end.
// If unavailable, fall back to a 30-day window ending now.
export function getCurrentPeriod(periodEndIso: string | null | undefined): Period {
  const now = new Date();
  if (periodEndIso) {
    const end = new Date(periodEndIso);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 1);
    if (start <= now && now <= end) return { start, end };
  }
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  return { start, end };
}

export async function getUsedTokens(userId: string, period: Period): Promise<number> {
  const { data } = await supabaseAdmin
    .from("usage")
    .select("total_tokens")
    .eq("user_id", userId)
    .eq("billing_period_start", period.start.toISOString())
    .maybeSingle();
  return data?.total_tokens ?? 0;
}

export async function addUsage(
  userId: string,
  period: Period,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const total = inputTokens + outputTokens;
  const { data: existing } = await supabaseAdmin
    .from("usage")
    .select("id, input_tokens, output_tokens, total_tokens")
    .eq("user_id", userId)
    .eq("billing_period_start", period.start.toISOString())
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("usage")
      .update({
        input_tokens: (existing.input_tokens ?? 0) + inputTokens,
        output_tokens: (existing.output_tokens ?? 0) + outputTokens,
        total_tokens: (existing.total_tokens ?? 0) + total,
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("usage").insert({
      user_id: userId,
      billing_period_start: period.start.toISOString(),
      billing_period_end: period.end.toISOString(),
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: total,
    });
  }
}
