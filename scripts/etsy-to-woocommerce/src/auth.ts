import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { ETSY_SCOPES, PATHS, requireEnv } from "./config.js";
import { exchangeAuthCode } from "./etsy-client.js";

function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function pkcePair(): { verifier: string; challenge: string } {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

async function main(): Promise<void> {
  const clientId = requireEnv("ETSY_CLIENT_ID");
  const redirectUri = "http://localhost:3003/callback";
  const { verifier, challenge } = pkcePair();
  const state = base64Url(randomBytes(16));

  const authUrl = new URL("https://www.etsy.com/oauth/connect");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", ETSY_SCOPES.join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  console.log("Open this URL in your browser and approve access:\n");
  console.log(authUrl.toString());
  console.log("\nWaiting for callback on http://localhost:3003/callback …\n");

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", redirectUri);
      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const returnedState = url.searchParams.get("state");
      const returnedCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      if (error) {
        const description = url.searchParams.get("error_description");
        const msg = description
          ? `Etsy OAuth error: ${error} — ${description}`
          : `Etsy OAuth error: ${error}`;
        res.writeHead(400);
        res.end(msg);
        reject(new Error(msg));
        server.close();
        return;
      }
      if (!returnedCode || returnedState !== state) {
        const hint =
          "No authorization code received. If Etsy showed “application is not recognized”, your app is likely still Pending Approval — check https://www.etsy.com/developers/your-apps";
        res.writeHead(400);
        res.end(hint);
        reject(new Error(`Invalid OAuth callback. ${hint}`));
        server.close();
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<h1>Etsy authorized</h1><p>You can close this tab and return to the terminal.</p>");
      resolve(returnedCode);
      server.close();
    });
    server.listen(3003, "127.0.0.1");
    server.on("error", reject);
  });

  const tokens = await exchangeAuthCode(code, verifier, redirectUri);
  writeFileSync(PATHS.tokens, JSON.stringify(tokens, null, 2));
  console.log(`Saved tokens to ${PATHS.tokens}`);
  console.log("\nAdd this to your .env file:\n");
  console.log(`ETSY_REFRESH_TOKEN=${tokens.refresh_token}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
