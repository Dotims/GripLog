// Signs in once and prints a session token for GRIPLOG_TOKEN.
// Usage: npm run token -w @griplog/mcp -- you@example.com your-password
const [email, password] = process.argv.slice(2);
const apiUrl = process.env.GRIPLOG_API_URL ?? "http://localhost:3000";

if (!email || !password) {
  console.error("Usage: npm run token -w @griplog/mcp -- you@example.com your-password");
  process.exit(1);
}

const response = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: apiUrl },
  body: JSON.stringify({ email, password }),
});
const body = (await response.json()) as { token?: string; message?: string };
if (!response.ok || !body.token) {
  console.error(`Sign in failed: ${body.message ?? response.status}`);
  process.exit(1);
}
console.log(body.token);

export {};
