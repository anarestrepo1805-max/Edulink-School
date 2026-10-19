/**
 * Export and Reporting service for institutional gradebooks and academic lists.
 * Supports CSV, Excel (.xls compatible XML/HTML), and clean print views.
 */

export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportMetadata {
  title: string;
  subtitle: string;
}

/**
 * Exports data rows to a standard UTF-8 CSV file and triggers browser download.
 */
export function exportToCSV(
  filename: string,
  rows: Record<string, any>[],
  columns: ExportColumn[]
): void {
  const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
  const lines = rows.map((r) =>
    columns
      .map((c) => {
        const val = r[c.key] !== undefined && r[c.key] !== null ? String(r[c.key]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers, ...lines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

/**
 * Exports data rows to an Excel-compatible spreadsheet table.
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  rows: Record<string, any>[],
  columns: ExportColumn[],
  metadata?: ExportMetadata
): void {
  let content = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetName}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        th { background-color: #00288e; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; }
        td { border: 1px solid #e2e8f0; padding: 6px; }
        .meta-title { font-size: 16px; font-weight: bold; color: #00288e; }
        .meta-sub { font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
  `;

  if (metadata) {
    content += `
      <p class="meta-title">${metadata.title}</p>
      <p class="meta-sub">${metadata.subtitle}</p>
      <br/>
    `;
  }

  content += '<table border="1">';
  content += '<thead><tr>';
  columns.forEach((col) => {
    content += `<th>${col.header}</th>`;
  });
  content += '</tr></thead><tbody>';

  rows.forEach((row) => {
    content += '<tr>';
    columns.forEach((col) => {
      const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
      content += `<td>${val}</td>`;
    });
    content += '</tr>';
  });

  content += '</tbody></table></body></html>';

  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, `${filename}.xls`);
}

/**
 * Opens a formatted printable report in a dedicated printable iframe or window.
 */
export function printFormattedReport(
  title: string,
  subtitle: string,
  tableHtml: string
): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8"/>
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #0f172a; }
        .header { border-bottom: 2px solid #00288e; padding-bottom: 12px; margin-bottom: 20px; }
        .inst { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #00288e; letter-spacing: 1px; }
        h1 { font-size: 20px; margin: 4px 0; color: #0b1c30; }
        .sub { font-size: 13px; color: #64748b; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
        th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-weight: bold; color: #0b1c30; }
        td { border: 1px solid #e2e8f0; padding: 7px 10px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
        @media print {
          body { margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="inst">Institución Educativa Vallejuelos • Medellín</div>
        <h1>${title}</h1>
        <div class="sub">${subtitle}</div>
      </div>
      ${tableHtml}
      <div class="footer">
        <span>Sistema de Gestión Escolar Edulink School • Reporte Oficial</span>
        <span>Generado el ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1500);
  }, 300);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
