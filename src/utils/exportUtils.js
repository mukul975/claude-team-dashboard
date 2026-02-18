export function exportToCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(v =>
    typeof v === 'string' ? '"' + v.replace(/"/g, '""') + '"' : v
  ).join(','));
  const csv = [headers, ...rows].join('\n');
  downloadFile(csv, filename + '.csv', 'text/csv');
}

export function exportToJSON(data, filename) {
  downloadFile(JSON.stringify(data, null, 2), filename + '.json', 'application/json');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
