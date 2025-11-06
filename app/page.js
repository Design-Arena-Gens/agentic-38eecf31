"use client";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_PROMPT = `Du ?r en kunnig AI-assistent som analyserar en eller flera bilder.
- Beskriv vad bilderna f?rest?ller p? svenska.
- Identifiera viktiga detaljer, text (OCR) och eventuella m?nster.
- Sammanfatta kort vad som ?r mest relevant.
Svara tydligt och strukturerat.`;

export default function Page() {
  const [files, setFiles] = useState([]);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setAnalysis("");
    if (!files.length) {
      setError("V?lj minst en bild.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("prompt", DEFAULT_PROMPT);
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Analysen misslyckades");
      const data = await res.json();
      setAnalysis(data.analysis || "(Inget svar)");
    } catch (err) {
      setError(err.message || "N?got gick fel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Bildanalys med LLM</h1>
        <p className="muted">Fota eller ladda upp en eller flera bilder. De skickas till en AI med en f?rdefinierad prompt och du f?r en sammanfattning tillbaka.</p>

        <form onSubmit={onSubmit}>
          <label>V?lj bilder</label>
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
          <small className="help">Tips: P? mobil kan du anv?nda kameran direkt.</small>

          {previews.length > 0 && (
            <div className="previews">
              {previews.map((src, i) => (
                <div className="preview" key={i}>
                  <img src={src} alt={`f?rhandsvisning-${i+1}`} />
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Analyserar?" : "Analysera bilder"}
            </button>
          </div>
        </form>

        {error && <div className="output" style={{ borderColor:'#7a2e2e', color:'#ffdede' }}>{error}</div>}
        {analysis && (
          <div className="output">
            <strong>AI-analys:</strong>
            <div style={{ marginTop: 8 }}>{analysis}</div>
          </div>
        )}

        <footer>
          F?rdefinierad prompt anv?nds. Laddas ny: {new Date().toLocaleDateString("sv-SE")}.
        </footer>
      </div>
    </div>
  );
}
