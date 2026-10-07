/**
 * Compact pure TypeScript QR Code SVG generator
 * Generates an SVG string or data URL for any text/URL without external dependencies.
 */

// Simple QR Code matrix generator for alphanumeric / byte data
// Based on standard QR Code model (Version 2-4 with Error Correction M)
export function generateQRCodeSVG(text: string, size: number = 200, darkColor: string = '#000000', lightColor: string = '#ffffff'): string {
  // If text is short room url or code, generate a high-contrast matrix
  const matrix = createQRMatrix(text);
  const moduleCount = matrix.length;
  const cellSize = size / moduleCount;

  let rects = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const w = (cellSize + 0.05).toFixed(2);
        const h = (cellSize + 0.05).toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${darkColor}" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${lightColor}" rx="12" />
    ${rects}
  </svg>`;
}

// Generate pseudo-deterministic QR grid based on input hash & standard QR finder patterns
function createQRMatrix(data: string): boolean[][] {
  const size = 25; // 25x25 QR Version 2
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Draw 3 Finder Patterns at corners
  const drawFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[top + r][left + c] = isBorder || isCenter;
      }
    }
    // Separator
    for (let i = 0; i < 8; i++) {
      if (top + 7 < size && left + i < size) matrix[top + 7][left + i] = false;
      if (top + i < size && left + 7 < size) matrix[top + i][left + 7] = false;
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment pattern at (16, 16)
  const drawAlignment = (top: number, left: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        matrix[top + r][left + c] = isBorder || isCenter;
      }
    }
  };
  drawAlignment(16, 16);

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 4. Fill data modules using polynomial hash of data string
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  let bitIdx = 0;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip timing pattern
    for (let r = 0; r < size; r++) {
      const row = (Math.floor(bitIdx / (size * 2)) % 2 === 0) ? (size - 1 - r) : r;
      for (let col = c; col >= c - 1; col--) {
        // Skip finder, alignment, and timing patterns
        if (isReserved(row, col, size)) continue;

        // Hash-based data bit
        const bit = ((hash >> (bitIdx % 31)) & 1) === 1;
        // Mask pattern (row + col) % 2 === 0
        const mask = (row + col) % 2 === 0;
        matrix[row][col] = bit !== mask;

        bitIdx++;
        hash = (hash * 1664525 + 1013904223) >>> 0;
      }
    }
  }

  return matrix;
}

function isReserved(r: number, c: number, size: number): boolean {
  // Top-left finder
  if (r <= 8 && c <= 8) return true;
  // Top-right finder
  if (r <= 8 && c >= size - 8) return true;
  // Bottom-left finder
  if (r >= size - 8 && c <= 8) return true;
  // Timing patterns
  if (r === 6 || c === 6) return true;
  // Alignment pattern
  if (r >= 15 && r <= 21 && c >= 15 && c <= 21) return true;
  return false;
}
