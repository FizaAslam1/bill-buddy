import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getBillAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: bills, error } = await supabase
      .from("bills")
      .select("bill_month, units, amount")
      .eq("user_id", userId)
      .order("bill_month", { ascending: false })
      .limit(6);

    if (error) throw new Error(error.message);
    if (!bills || bills.length === 0) {
      throw new Error("Add at least one bill before requesting AI advice.");
    }

    const chronological = [...bills].reverse();
    const billsText = chronological
      .map(
        (b) =>
          `- ${new Date(b.bill_month).toLocaleDateString("en-PK", { year: "numeric", month: "long" })}: ${b.units} units, PKR ${b.amount}`,
      )
      .join("\n");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a utility bill advisor for Pakistani households. Given the user's past electricity bill data (units consumed and amount paid per month), analyze the trend and explain in simple, friendly language why the bill went up or down, estimate next month's likely bill in PKR, and give 2-3 practical, low-cost saving tips relevant to Pakistani households (e.g. AC usage, peak hours, appliance habits). Keep the response short, clear, and in a numbered/bulleted format.",
          },
          {
            role: "user",
            content: `Here are my last ${chronological.length} electricity bills:\n${billsText}\n\nPlease analyze and advise.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
      if (response.status === 402) throw new Error("AI credits exhausted. Please add credits to your workspace.");
      throw new Error(`AI request failed [${response.status}]: ${text}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const advice = data.choices?.[0]?.message?.content ?? "";
    if (!advice) throw new Error("AI returned an empty response.");
    return { advice };
  });
