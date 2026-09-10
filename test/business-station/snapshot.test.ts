import test from "node:test";
import assert from "node:assert/strict";
import { parseSnapshot } from "../../src/lib/session-snapshot";
const message = {
  message_id: "m1",
  type: "agent",
  llm_data: JSON.stringify({
    Role: "assistant",
    Content: [
      { Type: "text", Text: "A grounded business plan." },
      { Type: "thinking", Thinking: "not public" },
    ],
  }),
  usage_data: JSON.stringify({
    input_tokens: 100,
    output_tokens: 30,
    cache_creation_input_tokens: 20,
    cache_read_input_tokens: 50,
  }),
  other_usage_data: JSON.stringify([
    { purpose: "slug", input_tokens: 10, output_tokens: 5 },
    { purpose: "compact", input_tokens: 20, output_tokens: 10 },
  ]),
};
test("parses actual Go Content/Type/Text casing and all reported usage", () => {
  assert.deepEqual(
    parseSnapshot({
      messages: [message],
      conversation: { agent_working: false },
    }),
    {
      output: "A grounded business plan.",
      usage: { input: 200, output: 45, cached: 50 },
      status: "completed",
    },
  );
});
test("no reported usage stays null, never presented as a measured zero", () => {
  assert.deepEqual(
    parseSnapshot({ messages: null, conversation: { agent_working: true } }),
    { output: null, usage: null, status: "running" },
  );
});
test("duplicate message IDs are counted once", () => {
  assert.deepEqual(
    parseSnapshot({
      messages: [message, message],
      conversation: { agent_working: false },
    }).usage,
    { input: 200, output: 45, cached: 50 },
  );
});
test("forked messages are displayed without charging copied usage twice", () => {
  const result = parseSnapshot({
    messages: [{ ...message, forked_from_message_id: "original" }],
    conversation: { agent_working: false },
  });
  assert.equal(result.usage, null);
  assert.equal(result.output, "A grounded business plan.");
});
test("recovered error followed by a successful answer is completed", () => {
  assert.equal(
    parseSnapshot({
      messages: [{ type: "error" }, message],
      conversation: { agent_working: false },
    }).status,
    "completed",
  );
});
test("terminal errors and model ErrorType surface as failed", () => {
  assert.equal(
    parseSnapshot({
      messages: [message, { type: "error" }],
      conversation: { agent_working: false },
    }).status,
    "failed",
  );
  assert.equal(
    parseSnapshot({
      messages: [
        {
          type: "agent",
          llm_data: JSON.stringify({ ErrorType: "llm_request", Content: [] }),
        },
      ],
      conversation: { agent_working: false },
    }).status,
    "failed",
  );
});
test("malformed usage is an explicit error, not quietly missing accounting", () => {
  assert.throws(
    () =>
      parseSnapshot({
        messages: [{ ...message, usage_data: "not json" }],
        conversation: { agent_working: false },
      }),
    /malformed/,
  );
  assert.throws(
    () =>
      parseSnapshot({
        messages: [{ ...message, other_usage_data: "{}" }],
        conversation: { agent_working: false },
      }),
    /malformed/,
  );
});
test("malformed snapshots and negative token values fail explicitly", () => {
  assert.throws(() => parseSnapshot({}), /Unexpected/);
  assert.throws(
    () =>
      parseSnapshot({
        messages: [{ ...message, usage_data: '{"input_tokens":-1}' }],
        conversation: { agent_working: false },
      }),
    /malformed/,
  );
});
