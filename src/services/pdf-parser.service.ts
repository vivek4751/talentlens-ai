// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { ParsingError } from '../core/errors';

export class PdfParserService {
  /**
   * Parses a PDF buffer and extracts plain text using pdf-parse.
   * Throws ParsingError if parsing fails or text is empty.
   */
  public static async parsePdf(buffer: Buffer): Promise<string> {
    try {
      // Older PDF.js versions can read the whole pooled Buffer backing store,
      // ignoring its byte offset. Give the parser an isolated, exact byte array.
      const data = await pdf(Uint8Array.from(buffer));
      const text = data?.text?.trim();
      if (!text) {
        throw new ParsingError('Failed to extract text from PDF; parsed document is empty.');
      }
      return text;
    } catch (error) {
      if (error instanceof ParsingError) {
        throw error;
      }
      throw new ParsingError(`PDF Parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

