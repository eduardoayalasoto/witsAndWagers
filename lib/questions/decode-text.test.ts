import { describe, it, expect } from "vitest";
import { decodeUploadedText } from "./decode-text";

function bufferFrom(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe("decodeUploadedText", () => {
  it("decodes plain ASCII unchanged", () => {
    const bytes = Array.from(Buffer.from("What is 2+2?", "utf-8"));
    expect(decodeUploadedText(bufferFrom(bytes))).toBe("What is 2+2?");
  });

  it("decodes valid UTF-8 with Spanish accents correctly", () => {
    const text = "¿Cuántas veces aumentó el ingreso? Año, niño, café";
    const bytes = Array.from(Buffer.from(text, "utf-8"));
    expect(decodeUploadedText(bufferFrom(bytes))).toBe(text);
  });

  it("strips a UTF-8 BOM", () => {
    const text = "Pregunta con ñ";
    const bytes = [0xef, 0xbb, 0xbf, ...Array.from(Buffer.from(text, "utf-8"))];
    expect(decodeUploadedText(bufferFrom(bytes))).toBe(text);
  });

  it("falls back to Windows-1252 for a CSV saved with Spanish accents in that encoding", () => {
    // Excel's "CSV (Comma delimited)" export on Windows commonly saves as
    // Windows-1252, not UTF-8. Decoding those bytes as strict UTF-8 fails,
    // so we should recover the real characters via Windows-1252 instead of
    // producing U+FFFD ("�") replacement characters.
    const text = "¿Cuántas veces aumentó el ingreso? Año, niño, café";
    const bytes = Array.from(Buffer.from(text, "latin1"));
    const decoded = decodeUploadedText(bufferFrom(bytes));
    expect(decoded).toBe(text);
    expect(decoded).not.toContain("�");
  });
});
