import { describe, expect, it } from "vitest";

import { wrapText } from "../canvasRenderer";

const createMockContext = () => {
  return {
    measureText: (text: string) => {
      const width = Array.from(text).reduce((acc, char) => acc + (char === " " ? 10 : 24), 0);
      return { width } as TextMetrics;
    },
  } as unknown as CanvasRenderingContext2D;
};

describe("wrapText", () => {
  it("wraps long Hindi strings without truncation", () => {
    const ctx = createMockContext();
    const headline = "यहएकबहुतलंबीसुर्खीहैजिसेमोड़नाहै";
    const result = wrapText(ctx, headline, 120, 40);
    expect(result.lines.length).toBeGreaterThan(1);
    expect(result.lines.join("")).toBe(headline);
  });

  it("wraps mixed Hindi and English content preserving words", () => {
    const ctx = createMockContext();
    const body = "नई नीति आज लागू हुई है and it affects small businesses across Delhi.";
    const result = wrapText(ctx, body, 240, 36);
    expect(result.lines.length).toBeGreaterThan(2);
    expect(result.lines.some((line) => line.length === 0)).toBe(false);
    expect(result.lines.join(" ").replace(/\s+/g, " ").trim()).toBe(body.replace(/\s+/g, " ").trim());
  });
});
