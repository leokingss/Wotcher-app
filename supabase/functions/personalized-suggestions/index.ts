// Personalized suggestions powered by Lovable AI.
// Takes a lightweight taste profile + candidate items (with tags) and returns
// a ranked subset with a one-line reason per pick.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Candidate = { id: string; tags: string[]; kind?: string };
type TasteProfile = {
  likedTags?: string[];
  dislikedTags?: string[];
  recentInteractions?: { tag: string; weight: number }[];
  favoriteCategories?: string[];
  followingStyles?: string[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, candidates, limit = 12 } = (await req.json()) as {
      profile: TasteProfile;
      candidates: Candidate[];
      limit?: number;
    };

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return new Response(JSON.stringify({ ranked: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a sophisticated taste curator for a creative social app.
Given a user's taste profile (liked/disliked tags, recent interactions, favorite categories,
styles of people they follow) and a list of candidate items each with tags, you must pick
the items most likely to delight THIS user. Reward overlap with liked tags and recent
interactions (weighted), penalize disliked tags, and reward novelty that is adjacent to
their taste (don't only show the obvious). Return a ranked subset with a short, specific
reason that references the user's actual taste signals.`;

    const userPrompt = JSON.stringify({ profile, candidates, limit });

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_personalized_ranking",
                description:
                  "Return a personalized ranked subset of candidates for this user.",
                parameters: {
                  type: "object",
                  properties: {
                    ranked: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          score: { type: "number" },
                          reason: { type: "string" },
                        },
                        required: ["id", "score", "reason"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["ranked"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_personalized_ranking" },
          },
        }),
      },
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      console.error("AI gateway error", status, body);
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits to keep curating." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments
      ? JSON.parse(toolCall.function.arguments)
      : { ranked: [] };

    // Filter to ids present in candidates and clamp
    const validIds = new Set(candidates.map((c) => c.id));
    const ranked = (args.ranked || [])
      .filter((r: any) => validIds.has(r.id))
      .slice(0, limit);

    return new Response(JSON.stringify({ ranked }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("personalized-suggestions error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
