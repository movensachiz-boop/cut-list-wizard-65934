import { Sheet, CutSequence } from './sheetOptimizer';

export interface CNCProgram {
  header: string;
  cuts: string[];
  footer: string;
}

/**
 * Export optimization to CNC-friendly format
 * This generates a simplified G-code-like format that can be adapted for different CNC machines
 */
export function exportToCNC(sheets: Sheet[], jobName: string = 'cutting_job'): void {
  const programs: string[] = [];

  sheets.forEach((sheet, sheetIndex) => {
    const program = generateCNCProgram(sheet, sheetIndex + 1, jobName);
    programs.push(formatCNCProgram(program));
  });

  const fullProgram = programs.join('\n\n' + '='.repeat(60) + '\n\n');
  downloadFile(fullProgram, `${jobName}_cnc.txt`, 'text/plain');
}

function generateCNCProgram(sheet: Sheet, sheetNumber: number, jobName: string): CNCProgram {
  const header = `; Fast Cut CNC Program
; Job: ${jobName}
; Sheet: ${sheetNumber} (${sheet.type.toUpperCase()})
; Sheet Size: ${sheet.width} x ${sheet.height} mm
; Parts: ${sheet.parts.length}
; Generated: ${new Date().toISOString()}
;
; IMPORTANT: This is a simplified cutting program
; Verify and adapt for your specific CNC machine before use
;
G21 ; Set units to millimeters
G90 ; Absolute positioning
G00 Z5.000 ; Raise tool to safe height
M03 S1000 ; Start spindle
G04 P2 ; Dwell 2 seconds`;

  const cuts: string[] = [];

  if (sheet.cutSequence) {
    // Generate cuts based on cut sequence
    sheet.cutSequence.forEach((cut, index) => {
      cuts.push(`; Cut ${index + 1}: ${cut.description}`);
      
      if (cut.type === 'horizontal') {
        // Horizontal cut (Y direction)
        cuts.push(`G00 X0.000 Y${cut.position.toFixed(3)} ; Position for horizontal cut`);
        cuts.push(`G01 Z-3.000 F500 ; Plunge to cutting depth`);
        cuts.push(`G01 X${sheet.width.toFixed(3)} F1000 ; Cut across width`);
        cuts.push(`G00 Z5.000 ; Retract`);
      } else {
        // Vertical cut (X direction)
        cuts.push(`G00 X${cut.position.toFixed(3)} Y0.000 ; Position for vertical cut`);
        cuts.push(`G01 Z-3.000 F500 ; Plunge to cutting depth`);
        cuts.push(`G01 Y${sheet.height.toFixed(3)} F1000 ; Cut across height`);
        cuts.push(`G00 Z5.000 ; Retract`);
      }
      cuts.push('');
    });
  } else {
    // Fallback: Generate perimeter cuts for each part
    sheet.parts.forEach((part, partIndex) => {
      cuts.push(`; Part ${partIndex + 1}: ${part.id} (${part.width} x ${part.height} mm)`);
      cuts.push(`G00 X${part.x.toFixed(3)} Y${part.y.toFixed(3)} ; Position to part origin`);
      cuts.push(`G01 Z-3.000 F500 ; Plunge to cutting depth`);
      
      // Cut perimeter (clockwise)
      cuts.push(`G01 X${(part.x + part.width).toFixed(3)} Y${part.y.toFixed(3)} F1000 ; Cut right edge`);
      cuts.push(`G01 X${(part.x + part.width).toFixed(3)} Y${(part.y + part.height).toFixed(3)} ; Cut top edge`);
      cuts.push(`G01 X${part.x.toFixed(3)} Y${(part.y + part.height).toFixed(3)} ; Cut left edge`);
      cuts.push(`G01 X${part.x.toFixed(3)} Y${part.y.toFixed(3)} ; Cut bottom edge`);
      
      cuts.push(`G00 Z5.000 ; Retract`);
      cuts.push('');
    });
  }

  const footer = `; End of program
M05 ; Stop spindle
G00 Z50.000 ; Move to safe height
G00 X0.000 Y0.000 ; Return to origin
M30 ; Program end`;

  return { header, cuts, footer };
}

function formatCNCProgram(program: CNCProgram): string {
  return [
    program.header,
    '',
    ...program.cuts,
    program.footer,
  ].join('\n');
}

/**
 * Export to DXF format (simplified)
 * This generates a basic DXF file with rectangles for each part
 */
export function exportToDXF(sheets: Sheet[], jobName: string = 'cutting_job'): void {
  let dxf = generateDXFHeader();

  sheets.forEach((sheet, sheetIndex) => {
    dxf += `\n; Sheet ${sheetIndex + 1}\n`;
    
    sheet.parts.forEach((part) => {
      dxf += generateDXFRectangle(part.x, part.y, part.width, part.height);
    });
  });

  dxf += generateDXFFooter();
  
  downloadFile(dxf, `${jobName}.dxf`, 'application/dxf');
}

function generateDXFHeader(): string {
  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES`;
}

function generateDXFRectangle(x: number, y: number, width: number, height: number): string {
  return `
0
LWPOLYLINE
8
0
90
5
70
1
10
${x.toFixed(3)}
20
${y.toFixed(3)}
10
${(x + width).toFixed(3)}
20
${y.toFixed(3)}
10
${(x + width).toFixed(3)}
20
${(y + height).toFixed(3)}
10
${x.toFixed(3)}
20
${(y + height).toFixed(3)}
10
${x.toFixed(3)}
20
${y.toFixed(3)}`;
}

function generateDXFFooter(): string {
  return `
0
ENDSEC
0
EOF`;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
