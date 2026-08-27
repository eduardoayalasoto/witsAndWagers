/**
 * Decode the raw bytes of an uploaded text file (CSV/JSON) into a string,
 * robustly handling files that weren't saved as UTF-8.
 *
 * Question text often contains Spanish accents (á, é, í, ó, ú), ñ, and
 * punctuation like ¿/¡. Files exported from Excel or older editors are
 * frequently saved as Windows-1252 (a superset of Latin-1) instead of
 * UTF-8. `File.text()`/`Blob.text()` always decode as UTF-8 regardless of
 * the file's real encoding, so those bytes get corrupted into the U+FFFD
 * replacement character ("�") wherever an accented letter appears.
 *
 * Strategy: try a strict UTF-8 decode first (the common case — handles a
 * UTF-8 BOM too). If the bytes aren't valid UTF-8, fall back to
 * Windows-1252, which maps every byte 0x00-0xFF to a real character and
 * correctly recovers accented letters/ñ/¿/¡ from the vast majority of
 * non-UTF-8 CSV/JSON exports.
 */
export function decodeUploadedText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}
