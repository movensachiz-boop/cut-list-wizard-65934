import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput } = await req.json();

    if (!userInput || typeof userInput !== "string") {
      return new Response(
        JSON.stringify({ error: "userInput is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all hardware items
    const { data: hardwareItems, error: fetchError } = await supabase
      .from("hardware_items")
      .select("id, name, short_name, import_code");

    if (fetchError) throw fetchError;

    // Use AI to match the user input to the best hardware item
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a hardware matching assistant. Given a user's input hardware name and a list of available hardware items, find the best match. Consider variations like:
- Different abbreviations (e.g., "16mm screws" = "16mmS")
- Plural/singular forms
- Different ordering of words
- Common misspellings
- Similar items (e.g., "soft close hinges" could match "Hinges soft close" or "SHSC")

Return the ID of the best matching hardware item, or null if no good match exists.`
          },
          {
            role: "user",
            content: `User input: "${userInput}"\n\nAvailable hardware:\n${JSON.stringify(
              hardwareItems?.map((item) => ({
                id: item.id,
                name: item.name,
                short_name: item.short_name,
                import_code: item.import_code,
              })),
              null,
              2
            )}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "match_hardware",
              description: "Return the best matching hardware item ID or null if no good match",
              parameters: {
                type: "object",
                properties: {
                  hardware_id: {
                    type: ["string", "null"],
                    description: "The UUID of the best matching hardware item, or null if no match"
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level of the match"
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why this match was chosen"
                  }
                },
                required: ["hardware_id", "confidence", "reasoning"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "match_hardware" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI matching failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return a match" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const matchResult = JSON.parse(toolCall.function.arguments);
    
    // If we have a match, fetch the full hardware item
    let matchedItem = null;
    if (matchResult.hardware_id) {
      const { data } = await supabase
        .from("hardware_items")
        .select("*")
        .eq("id", matchResult.hardware_id)
        .single();
      matchedItem = data;
    }

    return new Response(
      JSON.stringify({
        match: matchedItem,
        confidence: matchResult.confidence,
        reasoning: matchResult.reasoning
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});