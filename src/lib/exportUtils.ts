import { Sheet, PlacedPart, calculateTotalStats, CutSequence } from './sheetOptimizer';
import { detectEdgesNeedingBanding } from './edgingDetector';

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

export function exportSheetLayoutToPDF(sheets: Sheet[], jobName: string = 'layouts'): void {
  // Create a printable HTML page that will be converted to PDF via browser print
  const html = generatePrintableHTML(sheets, jobName);
  
  // Open in new window for printing
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
    const scale = 0.4; // Scale for printing (A4 page) - increased for better visibility
    
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
        
        <table>
          <thead>
            <tr>
              <th>Part ID</th>
              <th>Width</th>
              <th>Height</th>
              <th>X</th>
              <th>Y</th>
              <th>Rotated</th>
            </tr>
          </thead>
          <tbody>
            ${sheet.parts.map(part => `
              <tr>
                <td>${part.id}</td>
                <td>${part.width}mm</td>
                <td>${part.height}mm</td>
                <td>${part.x}mm</td>
                <td>${part.y}mm</td>
                <td>${part.rotated ? 'Yes' : 'No'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${sheet.cutSequence ? `
          <h3>Cut Sequence</h3>
          <table>
            <thead>
              <tr>
                <th>Step</th>
                <th>Type</th>
                <th>Position</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${sheet.cutSequence.map(cut => `
                <tr>
                  <td>${cut.step}</td>
                  <td>${cut.type}</td>
                  <td>${cut.position}mm</td>
                  <td>${cut.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
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
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #333;
          color: white;
        }
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
      <h1>Fast Cut - Cutting List</h1>
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
