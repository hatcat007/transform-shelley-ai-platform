import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { shelleyFetch, composeBrief } from "../../src/lib/harness";

// A protocol fixture, explicitly NOT an LLM or evidence of model quality.
test("Shelley adapter preserves arbitrary model identifiers, credentials, modes and provider errors", async () => {
  const oldUrl = process.env.SHELLEY_API_URL;
  const oldToken = process.env.SHELLEY_API_TOKEN;
  const requests: { url?: string; auth?: string; body: string }[] = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    requests.push({ url: req.url, auth: req.headers.authorization, body });
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/api/models")
      res.end(
        JSON.stringify([{ id: "custom/arbitrary-model:2026", ready: true }]),
      );
    else if (req.url === "/api/conversations/new")
      res.end(
        JSON.stringify({ conversation_id: "contract-fixture-not-a-real-run" }),
      );
    else {
      res.writeHead(503);
      res.end(JSON.stringify({ error: "Fixture unavailable" }));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.SHELLEY_API_URL = `http://127.0.0.1:${address.port}`;
  process.env.SHELLEY_API_TOKEN = "test-only-not-a-secret";
  try {
    const models = await (await shelleyFetch("models")).json();
    assert.equal(models[0].id, "custom/arbitrary-model:2026");
    const message = await composeBrief({
      mode: "business",
      message: "Review a business plan.",
      ponytail: true,
      caveman: false,
    });
    const result = await (
      await shelleyFetch("conversations/new", {
        method: "POST",
        body: JSON.stringify({
          message,
          model: models[0].id,
          conversation_options: { disable_all_tools: true },
        }),
      })
    ).json();
    assert.equal(result.conversation_id, "contract-fixture-not-a-real-run");
    assert.equal(requests[1].auth, "Bearer test-only-not-a-secret");
    const payload = JSON.parse(requests[1].body);
    assert.equal(payload.model, models[0].id);
    assert.equal(payload.conversation_options.disable_all_tools, true);
    assert.ok(!payload.message.includes("# Ponytail"));
    await assert.rejects(() => shelleyFetch("unavailable"), /HTTP 503/);
    delete process.env.SHELLEY_API_URL;
    await assert.rejects(
      () => shelleyFetch("models"),
      /Connect your Shelley server/,
    );
  } finally {
    if (oldUrl) process.env.SHELLEY_API_URL = oldUrl;
    else delete process.env.SHELLEY_API_URL;
    if (oldToken) process.env.SHELLEY_API_TOKEN = oldToken;
    else delete process.env.SHELLEY_API_TOKEN;
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
