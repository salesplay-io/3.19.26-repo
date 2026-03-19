import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

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
    const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
    const MICROSOFT_REDIRECT_URI = Deno.env.get("MICROSOFT_REDIRECT_URI");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_REDIRECT_URI) {
      throw new Error("Missing Microsoft OAuth credentials");
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: "Missing authorization code or state" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { userId, emailAddress } = JSON.parse(atob(state));

    const scopes = [
      "https://graph.microsoft.com/Mail.Send",
      "https://graph.microsoft.com/Mail.ReadWrite",
      "openid",
      "profile",
      "email",
      "offline_access",
    ];

    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          redirect_uri: MICROSOFT_REDIRECT_URI,
          grant_type: "authorization_code",
          scope: scopes.join(" "),
        }),
      }
    );

    const tokens = await tokenResponse.json();

    console.log("Token response:", {
      hasAccessToken: !!tokens.access_token,
      error: tokens.error,
      errorDescription: tokens.error_description
    });

    if (!tokens.access_token) {
      const errorMsg = tokens.error_description || tokens.error || "Failed to obtain access token";
      throw new Error(errorMsg);
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const hasActiveAccount = await supabase
      .from("email_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    const { error } = await supabase.from("email_accounts").insert({
      user_id: userId,
      email_address: emailAddress,
      provider: "outlook",
      smtp_host: "smtp-mail.outlook.com",
      smtp_port: 587,
      smtp_username: emailAddress,
      oauth_access_token: tokens.access_token,
      oauth_refresh_token: tokens.refresh_token,
      oauth_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      is_active: !hasActiveAccount.data,
      sync_enabled: true,
    });

    if (error) {
      throw error;
    }

    const baseUrl = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
    const redirectUrl = `${baseUrl}/settings?oauth=success&provider=microsoft`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    });
  } catch (error) {
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";
    const baseUrl = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
    const errorMessage = encodeURIComponent(error.message || "Unknown error");
    const redirectUrl = `${baseUrl}/settings?oauth=error&error=${errorMessage}`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    });
  }
});
