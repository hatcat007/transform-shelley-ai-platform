import { db } from "@/db";
import { stationSessions } from "@/db/schema";
import { getWorkspace, sameOrigin } from "@/lib/workspace";
import { shelleyFetch } from "@/lib/harness";
import { parseSnapshot } from "@/lib/session-snapshot";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
async function findSession(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const workspace = await getWorkspace();
  const [session] = await db
    .select()
    .from(stationSessions)
    .where(
      and(eq(stationSessions.id, id), eq(stationSessions.workspace, workspace)),
    );
  return session;
}
export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const session = await findSession(id);
    if (!session)
      return Response.json({ error: "Session not found." }, { status: 404 });
    if (session.status !== "running" || !session.remoteId)
      return Response.json(session);
    const snapshot = await (
      await shelleyFetch(`conversation/${encodeURIComponent(session.remoteId)}`)
    ).json();
    const values = parseSnapshot(snapshot);
    const [updated] = await db
      .update(stationSessions)
      .set(values)
      .where(
        and(eq(stationSessions.id, id), eq(stationSessions.status, "running")),
      )
      .returning();
    return Response.json(updated || (await findSession(id)));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not refresh session.",
      },
      { status: 502 },
    );
  }
}
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("chat"),
    message: z.string().trim().min(5).max(16000),
  }),
]);
export async function POST(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const { id } = await context.params;
    const session = await findSession(id);
    if (!session)
      return Response.json({ error: "Session not found." }, { status: 404 });
    const raw = await request.text();
    if (raw.length > 20000)
      return Response.json({ error: "Message is too large." }, { status: 413 });
    const parsed = actionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return Response.json(
        {
          error:
            "Choose a valid action and provide 5–16,000 characters for a follow-up.",
        },
        { status: 400 },
      );
    const action = parsed.data;
    if (action.action === "cancel") {
      if (session.status !== "running") return Response.json(session);
      if (session.remoteId)
        await shelleyFetch(
          `conversation/${encodeURIComponent(session.remoteId)}/cancel`,
          { method: "POST", body: "{}" },
        );
      const [updated] = await db
        .update(stationSessions)
        .set({ status: "cancelled" })
        .where(eq(stationSessions.id, id))
        .returning();
      return Response.json(updated);
    }
    if (!session.remoteId)
      return Response.json(
        {
          error:
            "This session has no remote conversation. Start a new session.",
        },
        { status: 409 },
      );
    if (session.status === "running")
      return Response.json(
        {
          error:
            "Wait for the current response or stop it before sending a follow-up.",
        },
        { status: 409 },
      );
    if (session.input.length + action.message.length > 64000)
      return Response.json(
        {
          error:
            "This session has reached its local brief limit. Start a new session with a concise summary.",
        },
        { status: 400 },
      );
    const [claimed] = await db
      .update(stationSessions)
      .set({ status: "running" })
      .where(
        and(
          eq(stationSessions.id, id),
          eq(stationSessions.status, session.status),
        ),
      )
      .returning();
    if (!claimed)
      return Response.json(
        { error: "This session changed. Refresh before sending." },
        { status: 409 },
      );
    try {
      await shelleyFetch(
        `conversation/${encodeURIComponent(session.remoteId)}/chat`,
        { method: "POST", body: JSON.stringify({ message: action.message }) },
      );
      const [updated] = await db
        .update(stationSessions)
        .set({ input: session.input + "\n\nFollow-up:\n" + action.message })
        .where(eq(stationSessions.id, id))
        .returning();
      return Response.json(updated);
    } catch (error) {
      await db
        .update(stationSessions)
        .set({ status: "failed" })
        .where(eq(stationSessions.id, id));
      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update session.";
    return Response.json(
      { error: message },
      {
        status:
          error instanceof SyntaxError
            ? 400
            : message.startsWith("Cross-origin")
              ? 403
              : 502,
      },
    );
  }
}
