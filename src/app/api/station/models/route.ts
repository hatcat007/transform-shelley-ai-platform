import { shelleyFetch } from "@/lib/harness";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!process.env.SHELLEY_API_URL)
    return Response.json({
      models: [],
      connected: false,
      message: "Connect a Shelley server to use your models.",
    });
  try {
    const models = await (await shelleyFetch("models")).json();
    if (!Array.isArray(models))
      throw new Error("Unexpected model catalog format.");
    return Response.json({
      models: models.filter((m) => m.ready),
      connected: true,
    });
  } catch (error) {
    return Response.json(
      {
        models: [],
        connected: false,
        message:
          error instanceof Error ? error.message : "Model connection failed.",
      },
      { status: 502 },
    );
  }
}
