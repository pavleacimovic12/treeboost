import { createWorker } from 'tesseract.js';
import * as XLSX from 'xlsx';

export class DocumentProcessor {
  static async extractText(filePath: string, mimeType: string, originalName: string): Promise<string> {
    console.log(`Extracting text from: ${originalName} (${mimeType})`);

    try {
      if (mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
        return await this.extractPDFText(filePath);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || originalName.toLowerCase().endsWith('.docx')) {
        return await this.extractDOCXText(filePath);
      } else if (mimeType.includes('spreadsheet') || originalName.toLowerCase().endsWith('.xlsx') || originalName.toLowerCase().endsWith('.xls')) {
        return await this.extractExcelText(filePath);
      } else if (mimeType === 'text/csv' || originalName.toLowerCase().endsWith('.csv')) {
        return await this.extractCSVText(filePath);
      } else if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(originalName)) {
        return await this.extractImageText(filePath);
      } else if (mimeType === 'text/plain' || originalName.toLowerCase().endsWith('.txt')) {
        return await this.extractPlainText(filePath);
      } else {
        return await this.extractPlainText(filePath);
      }
    } catch (error) {
      console.error(`Text extraction failed for ${originalName}:`, error);
      throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractPDFText(filePath: string): Promise<string> {
    try {
      const { execSync } = await import('child_process');
      const text = execSync(`pdftotext "${filePath}" -`, { maxBuffer: 50 * 1024 * 1024 }).toString();
      if (text.trim().length > 50) {
        return text;
      }
      throw new Error('PDF extraction failed');
    } catch (error) {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);
      return `PDF document (${buffer.length} bytes). Content extraction requires additional processing.`;
    }
  }

  private static async extractDOCXText(filePath: string): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);
      return `DOCX document (${buffer.length} bytes). Content: ${buffer.toString('utf-8', 0, 1000)}`;
    }
  }

  private static async extractExcelText(filePath: string): Promise<string> {
    try {
      const workbook = XLSX.readFile(filePath);
      let allText = '';
      
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        allText += `\n\n=== Sheet: ${sheetName} ===\n`;
        jsonData.forEach((row: any) => {
          allText += row.join(' | ') + '\n';
        });
      });
      
      return allText;
    } catch (error) {
      return `Excel file processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private static async extractCSVText(filePath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      const csvContent = await fs.readFile(filePath, 'utf-8');
      return csvContent;
    } catch (error) {
      return `CSV file processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private static async extractPlainText(filePath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      const text = await fs.readFile(filePath, 'utf-8');
      return text;
    } catch (error) {
      return `Text file processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private static async extractImageText(filePath: string): Promise<string> {
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();
      return text;
    } catch (error) {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(filePath);
      return `Image file (${buffer.length} bytes). OCR processing available.`;
    }
  }

  static chunkText(text: string, maxChunkSize: number = 6000): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = "";
    
    for (const sentence of sentences) {
      const potentialChunk = currentChunk + sentence + ". ";
      
      if (potentialChunk.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + ". ";
      } else {
        currentChunk = potentialChunk;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [text.substring(0, maxChunkSize)];
  }
}
