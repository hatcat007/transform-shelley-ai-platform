import { z } from "zod";
const messageSchema = z.object({
  message_id: z.string().optional(),
  type: z.string(),
  llm_data: z.string().nullable().optional(),
  usage_data: z.string().nullable().optional(),
  other_usage_data: z.string().nullable().optional(),
  forked_from_message_id: z.string().nullable().optional(),
});
const snapshotSchema = z.object({
  messages: z.array(messageSchema).nullable(),
  conversation: z.object({ agent_working: z.boolean() }),
});
const usageSchema = z.object({
  input_tokens: z.number().nonnegative().optional(),
  output_tokens: z.number().nonnegative().optional(),
  cache_creation_input_tokens: z.number().nonnegative().optional(),
  cache_read_input_tokens: z.number().nonnegative().optional(),
});
export function parseSnapshot(value: unknown) {
  const parsed = snapshotSchema.safeParse(value);
  if (!parsed.success)
    throw new Error("Unexpected Shelley conversation response.");
  const snapshot = parsed.data;
  let input = 0,
    output = 0,
    cached = 0,
    hasUsage = false,
    lastType = "";
  const texts: string[] = [];
  const seen = new Set<string>();
  const addUsage = (value: unknown) => {
    const u = usageSchema.parse(value);
    if (Object.keys(u).length === 0) return;
    hasUsage = true;
    input +=
      (u.input_tokens || 0) +
      (u.cache_creation_input_tokens || 0) +
      (u.cache_read_input_tokens || 0);
    output += u.output_tokens || 0;
    cached += u.cache_read_input_tokens || 0;
  };
  for (const message of snapshot.messages || []) {
    if (message.message_id) {
      if (seen.has(message.message_id)) continue;
      seen.add(message.message_id);
    }
    try {
      if (!message.forked_from_message_id) {
        if (message.usage_data) addUsage(JSON.parse(message.usage_data));
        if (message.other_usage_data) {
          const indirect = JSON.parse(message.other_usage_data);
          if (!Array.isArray(indirect)) continue;
          for (const item of indirect) addUsage(item);
        }
      }
      if (message.type === "error") lastType = "error";
      if (message.type === "agent" && message.llm_data) {
        const content = z
          .object({
            Content: z
              .array(
                z.object({ Type: z.string(), Text: z.string().optional() }),
              )
              .optional(),
            ErrorType: z.string().optional(),
          })
          .parse(JSON.parse(message.llm_data));
        lastType = content.ErrorType ? "error" : "agent";
        for (const block of content.Content || [])
          if (block.Type === "text" && block.Text) texts.push(block.Text);
      }
    } catch {
      continue;
    }
  }
  return {
    output: texts.join("\n\n") || null,
    usage: hasUsage ? { input, output, cached } : null,
    status: snapshot.conversation.agent_working
      ? "running"
      : lastType === "error"
        ? "failed"
        : "completed",
  };
}
