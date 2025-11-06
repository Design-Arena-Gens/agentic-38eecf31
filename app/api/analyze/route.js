import OpenAI from "openai";

export const runtime = "nodejs";

function bytesToSize(bytes) {
  if (!bytes && bytes !== 0) return "ok?nd storlek";
  const sizes = ["B", "KB", "MB", "GB"]; 
  if (bytes === 0) return "0 B"; 
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    const userPrompt = formData.get("prompt");

    if (!files || files.length === 0) {
      return Response.json({ error: "Inga bilder mottagna" }, { status: 400 });
    }

    const prompt = (typeof userPrompt === 'string' && userPrompt.trim()) || `Du ?r en kunnig AI-assistent som analyserar en eller flera bilder.\n- Beskriv vad bilderna f?rest?ller p? svenska.\n- Identifiera viktiga detaljer, text (OCR) och eventuella m?nster.\n- Sammanfatta kort vad som ?r mest relevant.\nSvara tydligt och strukturerat.`;

    // Prepare images as data URLs
    const imageContents = [];
    const meta = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mime = file.type || "image/jpeg";
      imageContents.push({ type: "input_image", image_url: `data:${mime};base64,${base64}` });
      meta.push({ name: file.name || "bild", size: bytesToSize(file.size) });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Mock response when no API key is configured
      const mock = [
        `Antal bilder: ${files.length}.`,
        `Filer: ${meta.map(m => `${m.name} (${m.size})`).join(', ')}.`,
        `Ingen riktig LLM-nyckel hittades. Detta ?r en exempelanalys.`,
        `Exempel: Bild(er) visar troligen objekt/scener. Eventuell text (OCR) kan extraheras med en aktiverad LLM.`
      ].join("\n");
      return Response.json({ analysis: mock, provider: "mock" });
    }

    const openai = new OpenAI({ apiKey });

    // Use gpt-4o-mini for cost-effective vision
    const content = [{ type: "text", text: prompt }, ...imageContents];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.2,
    });

    const text = completion.choices?.[0]?.message?.content?.trim?.() || "(tomt svar)";
    return Response.json({ analysis: text, provider: "openai:gpt-4o-mini" });
  } catch (err) {
    console.error("/api/analyze error", err);
    return Response.json({ error: "Internt fel" }, { status: 500 });
  }
}
