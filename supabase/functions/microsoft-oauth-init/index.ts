import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const MICROSOFT_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID");
    const MICROSOFT_REDIRECT_URI = Deno.env.get("MICROSOFT_REDIRECT_URI");

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_REDIRECT_URI) {
      throw new Error("Missing Microsoft OAuth credentials");
    }

    const scopes = [
      "https://graph.microsoft.com/Mail.Send",
      "https://graph.microsoft.com/Mail.ReadWrite",
      "openid",
      "profile",
      "email",
      "offline_access",
    ];

    const { userId, emailAddress } = await req.json();

    if (!userId || !emailAddress) {
      return new Response(
        JSON.stringify({ error: "Missing userId or emailAddress" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const state = btoa(JSON.stringify({ userId, emailAddress }));

    const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    authUrl.searchParams.set("client_id", MICROSOFT_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", MICROSOFT_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "consent");

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
