import { db } from "@/db";
import {
  stationAssets,
  stationVersions,
  stationProjects,
  stationPreferences,
  stationSessions,
} from "@/db/schema";
import { getWorkspace, sameOrigin } from "@/lib/workspace";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "node:crypto";
export const dynamic = "force-dynamic";
const assetSchema = z.object({
  action: z.literal("saveAsset"),
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(3).max(300),
  kind: z.enum(["agent", "prompt"]),
  category: z.string().trim().min(1).max(60),
  instructions: z.string().trim().min(20).max(24000),
  version: z.number().int().positive().optional(),
});
const schema = z.discriminatedUnion("action", [
  assetSchema,
  z.object({
    action: z.literal("project"),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000),
  }),
  z.object({
    action: z.literal("preferences"),
    ponytail: z.boolean(),
    caveman: z.boolean(),
    name: z.string().trim().min(2).max(80),
  }),
  z.object({ action: z.literal("share"), id: z.uuid(), enabled: z.boolean() }),
  z.object({ action: z.literal("deleteAsset"), id: z.uuid() }),
]);
export async function GET(request: Request) {
  try {
    const workspace = await getWorkspace();
    const id = new URL(request.url).searchParams.get("versions");
    if (id) {
      if (!z.uuid().safeParse(id).success)
        return Response.json({ error: "Invalid asset ID." }, { status: 400 });
      const [asset] = await db
        .select()
        .from(stationAssets)
        .where(
          and(eq(stationAssets.id, id), eq(stationAssets.workspace, workspace)),
        );
      if (!asset)
        return Response.json({ error: "Asset not found." }, { status: 404 });
      return Response.json(
        await db
          .select()
          .from(stationVersions)
          .where(eq(stationVersions.assetId, id))
          .orderBy(desc(stationVersions.version)),
      );
    }
    const [assets, projects, sessions, preferences] = await Promise.all([
      db
        .select()
        .from(stationAssets)
        .where(eq(stationAssets.workspace, workspace))
        .orderBy(desc(stationAssets.updatedAt)),
      db
        .select()
        .from(stationProjects)
        .where(eq(stationProjects.workspace, workspace))
        .orderBy(desc(stationProjects.createdAt)),
      db
        .select()
        .from(stationSessions)
        .where(eq(stationSessions.workspace, workspace))
        .orderBy(desc(stationSessions.createdAt))
        .limit(100),
      db
        .select()
        .from(stationPreferences)
        .where(eq(stationPreferences.workspace, workspace)),
    ]);
    return Response.json({
      assets,
      projects,
      sessions,
      preferences: preferences[0] ?? {
        ponytail: false,
        caveman: false,
        name: "My workspace",
      },
    });
  } catch (error) {
    console.error("Station read failed", error);
    return Response.json(
      { error: "Workspace could not be loaded. Please try again." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const bodyText = await request.text();
    if (bodyText.length > 40000)
      return Response.json({ error: "Request too large." }, { status: 413 });
    const body = schema.safeParse(JSON.parse(bodyText));
    if (!body.success)
      return Response.json(
        { error: body.error.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    const workspace = await getWorkspace();
    const data = body.data;
    if (data.action === "preferences") {
      const values = {
        workspace,
        ponytail: data.ponytail,
        caveman: data.caveman,
        name: data.name,
      };
      await db
        .insert(stationPreferences)
        .values(values)
        .onConflictDoUpdate({
          target: stationPreferences.workspace,
          set: values,
        });
      return Response.json(values);
    }
    if (data.action === "project") {
      const [project] = await db
        .insert(stationProjects)
        .values({ workspace, name: data.name, description: data.description })
        .returning();
      return Response.json(project, { status: 201 });
    }
    if (data.action === "saveAsset") {
      const result = await db.transaction(async (tx) => {
        const values = {
          name: data.name,
          description: data.description,
          kind: data.kind,
          category: data.category,
          instructions: data.instructions,
          updatedAt: new Date(),
        };
        if (data.id) {
          const [existing] = await tx
            .select()
            .from(stationAssets)
            .where(
              and(
                eq(stationAssets.id, data.id),
                eq(stationAssets.workspace, workspace),
              ),
            )
            .for("update");
          if (!existing) throw new Error("Asset not found.");
          if (data.version !== existing.version)
            throw new Error(
              "This asset changed. Reload before saving to avoid overwriting another version.",
            );
          const version = existing.version + 1;
          const [updated] = await tx
            .update(stationAssets)
            .set({ ...values, version })
            .where(eq(stationAssets.id, data.id))
            .returning();
          await tx
            .insert(stationVersions)
            .values({
              assetId: data.id,
              version,
              instructions: data.instructions,
            });
          return updated;
        }
        const [asset] = await tx
          .insert(stationAssets)
          .values({ ...values, workspace })
          .returning();
        await tx
          .insert(stationVersions)
          .values({
            assetId: asset.id,
            version: 1,
            instructions: data.instructions,
          });
        return asset;
      });
      return Response.json(result, { status: 201 });
    }
    if (data.action === "share") {
      const [asset] = await db
        .update(stationAssets)
        .set({ shareToken: data.enabled ? randomUUID() : null })
        .where(
          and(
            eq(stationAssets.id, data.id),
            eq(stationAssets.workspace, workspace),
          ),
        )
        .returning();
      if (!asset)
        return Response.json({ error: "Asset not found." }, { status: 404 });
      return Response.json({ token: asset.shareToken });
    }
    if (data.action === "deleteAsset") {
      const result = await db
        .delete(stationAssets)
        .where(
          and(
            eq(stationAssets.id, data.id),
            eq(stationAssets.workspace, workspace),
          ),
        )
        .returning({ id: stationAssets.id });
      return Response.json({ deleted: result.length > 0 });
    }
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json({ error: "Invalid JSON." }, { status: 400 });
    const message = error instanceof Error ? error.message : "Unable to save.";
    if (message.startsWith("Cross-origin"))
      return Response.json({ error: message }, { status: 403 });
    if (message.startsWith("This asset changed"))
      return Response.json({ error: message }, { status: 409 });
    if (message === "Asset not found.")
      return Response.json({ error: message }, { status: 404 });
    console.error("Station write failed", error);
    return Response.json(
      { error: "Unable to save your changes. Please try again." },
      { status: 500 },
    );
  }
}
