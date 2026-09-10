import { db } from "@/db";
import { stationSessions } from "@/db/schema";
import { getWorkspace, sameOrigin } from "@/lib/workspace";
import { composeBrief, shelleyFetch } from "@/lib/harness";
import { z } from "zod";
import { eq } from "drizzle-orm";
const schema = z.object({
  message: z.string().trim().min(5).max(16000),
  model: z.string().min(1).max(200),
  mode: z.enum(["business", "coding"]),
  instructions: z.string().max(24000).optional(),
  agent: z.string().max(100).optional(),
  ponytail: z.boolean(),
  caveman: z.boolean(),
});
export async function POST(request: Request) {
  let sessionId: string | undefined;
  try {
    sameOrigin(request);
    const raw = await request.text();
    if (raw.length > 50000)
      return Response.json({ error: "Brief is too large." }, { status: 413 });
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return Response.json(
        {
          error:
            "Provide a brief of 5–16,000 characters and select an available model.",
        },
        { status: 400 },
      );
    if (!process.env.SHELLEY_API_URL)
      return Response.json(
        {
          error:
            "No model server is connected. Set SHELLEY_API_URL in the server environment, then refresh models in Settings. Your brief has not been sent.",
        },
        { status: 503 },
      );
    const data = parsed.data;
    const models = await (await shelleyFetch("models")).json();
    if (
      !Array.isArray(models) ||
      !models.some((m) => m.id === data.model && m.ready)
    )
      return Response.json(
        {
          error:
            "This model is no longer available. Refresh models in Settings.",
        },
        { status: 400 },
      );
    const workspace = await getWorkspace();
    const message = await composeBrief(data);
    const [session] = await db
      .insert(stationSessions)
      .values({
        workspace,
        title: data.message.slice(0, 90),
        mode: data.mode,
        model: data.model,
        agent: data.agent,
        input: data.message,
        skills: {
          ponytail: data.ponytail && data.mode === "coding",
          caveman: data.caveman,
        },
      })
      .returning();
    sessionId = session.id;
    const remote = await (
      await shelleyFetch("conversations/new", {
        method: "POST",
        body: JSON.stringify({
          message,
          model: data.model,
          conversation_options: {
            disable_all_tools: data.mode === "business",
            disable_notifications: true,
          },
        }),
      })
    ).json();
    if (typeof remote.conversation_id !== "string")
      throw new Error("Shelley did not return a conversation ID.");
    const [updated] = await db
      .update(stationSessions)
      .set({ remoteId: remote.conversation_id })
      .where(eq(stationSessions.id, session.id))
      .returning();
    return Response.json(updated, { status: 201 });
  } catch (error) {
    if (sessionId)
      await db
        .update(stationSessions)
        .set({ status: "failed" })
        .where(eq(stationSessions.id, sessionId));
    if (error instanceof SyntaxError)
      return Response.json({ error: "Invalid JSON." }, { status: 400 });
    const message =
      error instanceof Error ? error.message : "Agent could not start.";
    return Response.json(
      { error: message },
      { status: message.startsWith("Cross-origin") ? 403 : 502 },
    );
  }
}
