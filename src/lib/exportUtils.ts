import { Sheet, PlacedPart, calculateTotalStats, CutSequence } from './sheetOptimizer';
import { detectEdgesNeedingBanding } from './edgingDetector';

// Interface for cutting list items (before optimization)
interface CuttingItem {
  id: string;
  length: number;
  width: number;
  quantity: number;
  material: string;
  edging: string;
  edgingMaterial: string;
  notes?: string;
}

// Export cutting list items to CSV (Meza-compatible format)
export function exportCuttingListToCSV(items: CuttingItem[], jobName: string = 'cutting_list'): void {
  const csvRows: string[] = [];
  
  // Separator indicator for Excel
  csvRows.push('Sep=,');
  
  // Header (Meza-compatible format)
  csvRows.push('"Type","Name","Length","Width","Quantity","Notes","Can Rotate (0 = No / 1 = Yes / 2 = Same As Material)","Material","Edging Length 1","Edging Length 2","Edging Width 1","Edging Width 2","Include Edging Thickness","Note 1","Note 2","Note 3","Note 4","Group","Report Tags","Import ID","Parent ID","Library Item Name","Holes Length 1","Holes Length 2","Holes Width 1","Holes Width 2","Grooving Length 1","Grooving Length 2","Grooving Width 1","Grooving Width 2","Material Tag","Edging Length 1 Tag","Edging Length 2 Tag","Edging Width 1 Tag","Edging Width 2 Tag","Apply Machining Charge","Long Expansion","Short Expansion"');
  
  // Data rows
  items.forEach((item, index) => {
    const edgingL1 = getEdgingCode(item.edging, 'L1', item.edgingMaterial);
    const edgingL2 = getEdgingCode(item.edging, 'L2', item.edgingMaterial);
    const edgingW1 = getEdgingCode(item.edging, 'W1', item.edgingMaterial);
    const edgingW2 = getEdgingCode(item.edging, 'W2', item.edgingMaterial);
    
    csvRows.push([
      '"Input Panel"',
      '""',
      `"${item.length} mm"`,
      `"${item.width} mm"`,
      `"${item.quantity}"`,
      `"${item.notes || ''}"`,
      '"IfNoGrain"',
      `"${item.material}"`,
      `"${edgingL1}"`,
      `"${edgingL2}"`,
      `"${edgingW1}"`,
      `"${edgingW2}"`,
      '"False"',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      `"${index + 1}"`,
      `"${index + 1}"`,
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '"0"',
      '"0"',
    ].join(','));
  });
  
  downloadFile(csvRows.join('\n'), `${jobName}.csv`, 'text/csv');
}

// Helper to convert edging type to Meza format
function getEdgingCode(edging: string, position: 'L1' | 'L2' | 'W1' | 'W2', edgingMaterial: string): string {
  if (!edging || edging === 'None') return '';
  
  const edgingName = edgingMaterial || 'Colour Edging';
  
  switch (edging) {
    case '4 Sides':
      return edgingName;
    case '2 Long':
      return (position === 'L1' || position === 'L2') ? edgingName : '';
    case '2 Short':
      return (position === 'W1' || position === 'W2') ? edgingName : '';
    case '1 Long':
      return position === 'L1' ? edgingName : '';
    case '1 Short':
      return position === 'W1' ? edgingName : '';
    case '3 Sides (1L, 2S)':
      return (position === 'L1' || position === 'W1' || position === 'W2') ? edgingName : '';
    case '3 Sides (2L, 1S)':
      return (position === 'L1' || position === 'L2' || position === 'W1') ? edgingName : '';
    default:
      return '';
  }
}

// Legacy CSV export for optimized sheets (kept for backwards compatibility)
export function exportToCSV(sheets: Sheet[], jobName: string = 'cutting_list'): void {
  const csvRows: string[] = [];
  
  // Header
  csvRows.push('Sheet,Part ID,Width (mm),Height (mm),X Position,Y Position,Rotated,Material,Edging Type,Edging Material,Edging Left,Edging Right,Edging Top,Edging Bottom,Waste %');
  
  // Data rows
  sheets.forEach((sheet, sheetIndex) => {
    sheet.parts.forEach((part) => {
      const edges = detectEdgesNeedingBanding(part.edging, part.rotated);
      csvRows.push([
        `Sheet ${sheetIndex + 1}`,
        part.id,
        part.width,
        part.height,
        part.x,
        part.y,
        part.rotated ? 'Yes' : 'No',
        part.material || '',
        part.edging || '',
        part.edgingMaterial || '',
        edges.left ? 'Yes' : '',
        edges.right ? 'Yes' : '',
        edges.top ? 'Yes' : '',
        edges.bottom ? 'Yes' : '',
        sheet.wastePercentage.toFixed(2),
      ].join(','));
    });
  });
  
  // Add summary
  const stats = calculateTotalStats(sheets);
  csvRows.push('');
  csvRows.push('Summary');
  csvRows.push(`Total Sheets,${stats.totalSheets}`);
  csvRows.push(`Total Area (m²),${(stats.totalArea / 1000000).toFixed(2)}`);
  csvRows.push(`Used Area (m²),${(stats.totalUsedArea / 1000000).toFixed(2)}`);
  csvRows.push(`Waste Area (m²),${(stats.totalWaste / 1000000).toFixed(2)}`);
  csvRows.push(`Average Waste %,${stats.averageWastePercentage.toFixed(2)}`);
  
  downloadFile(csvRows.join('\n'), `${jobName}.csv`, 'text/csv');
}

export function exportToExcel(sheets: Sheet[], jobName: string = 'cutting_list'): void {
  // Create Excel-compatible CSV with tabs
  const rows: string[] = [];
  
  rows.push('FAST CUT - CUTTING LIST');
  rows.push(`Job: ${jobName}\tDate: ${new Date().toLocaleDateString()}`);
  rows.push('');
  
  sheets.forEach((sheet, sheetIndex) => {
    rows.push(`SHEET ${sheetIndex + 1}\t${sheet.type.toUpperCase()}\t${sheet.width} × ${sheet.height} mm`);
    rows.push('Part ID\tWidth\tHeight\tX\tY\tRotated\tMaterial\tEdging Type\tEdging Material\tEdging Left\tEdging Right\tEdging Top\tEdging Bottom\tWaste %');
    
    sheet.parts.forEach((part) => {
      const edges = detectEdgesNeedingBanding(part.edging, part.rotated);
      rows.push([
        part.id,
        part.width,
        part.height,
        part.x,
        part.y,
        part.rotated ? 'Yes' : 'No',
        part.material || '-',
        part.edging || '-',
        part.edgingMaterial || '-',
        edges.left ? 'Yes' : '-',
        edges.right ? 'Yes' : '-',
        edges.top ? 'Yes' : '-',
        edges.bottom ? 'Yes' : '-',
        sheet.wastePercentage.toFixed(2),
      ].join('\t'));
    });
    
    if (sheet.cutSequence) {
      rows.push('');
      rows.push('CUT SEQUENCE');
      rows.push('Step\tType\tPosition\tDescription');
      sheet.cutSequence.forEach(cut => {
        rows.push(`${cut.step}\t${cut.type}\t${cut.position}mm\t${cut.description}`);
      });
    }
    
    rows.push('');
  });
  
  // Summary
  const stats = calculateTotalStats(sheets);
  rows.push('SUMMARY');
  rows.push(`Total Sheets\t${stats.totalSheets}`);
  rows.push(`Total Area\t${(stats.totalArea / 1000000).toFixed(2)} m²`);
  rows.push(`Used Area\t${(stats.totalUsedArea / 1000000).toFixed(2)} m²`);
  rows.push(`Waste Area\t${(stats.totalWaste / 1000000).toFixed(2)} m²`);
  rows.push(`Average Waste\t${stats.averageWastePercentage.toFixed(2)}%`);
  
  downloadFile(rows.join('\n'), `${jobName}.xls`, 'application/vnd.ms-excel');
}

// PDF export - Only shows optimization layouts (sheet visualizations)
export function exportSheetLayoutToPDF(sheets: Sheet[], jobName: string = 'layouts'): void {
  const html = generatePrintableHTML(sheets, jobName);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

function generatePrintableHTML(sheets: Sheet[], jobName: string): string {
  const stats = calculateTotalStats(sheets);
  
  let partsHTML = '';
  sheets.forEach((sheet, sheetIndex) => {
    const scale = 0.4;
    
    partsHTML += `
      <div class="sheet-page">
        <h2>Sheet ${sheetIndex + 1} - ${sheet.type.toUpperCase()}</h2>
        <p>Dimensions: ${sheet.width} × ${sheet.height} mm | Waste: ${sheet.wastePercentage.toFixed(1)}%</p>
        
        <svg width="${sheet.width * scale}" height="${sheet.height * scale}" style="border: 2px solid #333; background: #f9f9f9;">
          ${sheet.parts.map((part, partIndex) => {
            const hue = (partIndex * 137.5) % 360;
            const edges = detectEdgesNeedingBanding(part.edging, part.rotated);
            const edgeStroke = 3;
            
            let edgingLines = '';
            if (edges.top) {
              edgingLines += `<line x1="${part.x * scale}" y1="${part.y * scale}" x2="${(part.x + part.width) * scale}" y2="${part.y * scale}" stroke="#22c55e" stroke-width="${edgeStroke}" />`;
            }
            if (edges.bottom) {
              edgingLines += `<line x1="${part.x * scale}" y1="${(part.y + part.height) * scale}" x2="${(part.x + part.width) * scale}" y2="${(part.y + part.height) * scale}" stroke="#22c55e" stroke-width="${edgeStroke}" />`;
            }
            if (edges.left) {
              edgingLines += `<line x1="${part.x * scale}" y1="${part.y * scale}" x2="${part.x * scale}" y2="${(part.y + part.height) * scale}" stroke="#22c55e" stroke-width="${edgeStroke}" />`;
            }
            if (edges.right) {
              edgingLines += `<line x1="${(part.x + part.width) * scale}" y1="${part.y * scale}" x2="${(part.x + part.width) * scale}" y2="${(part.y + part.height) * scale}" stroke="#22c55e" stroke-width="${edgeStroke}" />`;
            }
            
            return `
              <rect
                x="${part.x * scale}"
                y="${part.y * scale}"
                width="${part.width * scale}"
                height="${part.height * scale}"
                fill="hsl(${hue}, 70%, 85%)"
                stroke="hsl(${hue}, 70%, 40%)"
                stroke-width="1"
              />
              ${edgingLines}
              <text
                x="${(part.x + part.width / 2) * scale}"
                y="${(part.y + part.height / 2 - 70) * scale}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="20"
                font-weight="bold"
                fill="#000"
              >
                ${part.id.split('-')[0]}
              </text>
              <text
                x="${(part.x + part.width / 2) * scale}"
                y="${(part.y + part.height / 2) * scale}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="20"
                font-weight="bold"
                fill="#333"
              >
                ${part.width} × ${part.height} mm
              </text>
              <text
                x="${(part.x + part.width / 2) * scale}"
                y="${(part.y + part.height / 2 + 70) * scale}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="20"
                font-weight="bold"
                fill="#666"
              >
                ${part.material || 'Standard'}
              </text>
              <text
                x="${(part.x + part.width / 2) * scale}"
                y="${(part.y + part.height / 2 + 140) * scale}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="20"
                font-weight="bold"
                fill="#22c55e"
              >
                ${part.edging || 'No edging'}
              </text>
            `;
          }).join('')}
        </svg>
      </div>
    `;
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fast Cut - ${jobName}</title>
      <style>
        @media print {
          .sheet-page { page-break-after: always; }
        }
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 { text-align: center; }
        h2 { margin-top: 20px; border-bottom: 2px solid #333; }
        h3 { margin-top: 15px; }
        svg { margin: 20px 0; }
        .summary {
          background: #f0f0f0;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>Fast Cut - Optimization Layout</h1>
      <div class="summary">
        <h3>Summary</h3>
        <p>Job: ${jobName}</p>
        <p>Date: ${new Date().toLocaleString()}</p>
        <p>Total Sheets: ${stats.totalSheets}</p>
        <p>Total Area: ${(stats.totalArea / 1000000).toFixed(2)} m²</p>
        <p>Used Area: ${(stats.totalUsedArea / 1000000).toFixed(2)} m²</p>
        <p>Waste: ${(stats.totalWaste / 1000000).toFixed(2)} m² (${stats.averageWastePercentage.toFixed(1)}%)</p>
      </div>
      
      ${partsHTML}
    </body>
    </html>
  `;
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