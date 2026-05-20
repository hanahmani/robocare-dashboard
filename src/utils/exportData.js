export function exportToCSV(notifications, filename = 'notifications.csv') {
  const headers = ['ID', 'Type', 'Status', 'Recipient', 'Subject', 'Message', 'Template', 'Sent At', 'Error']
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = notifications.map(n => [
    n.id ?? n.raw?.id ?? '',
    n.type ?? '',
    n.status ?? '',
    n.recipient ?? '',
    n.subject ?? '',
    (n.message || n.fullMessage || '').replace(/\n/g, ' '),
    n.templateName ?? '',
    n.raw?.sentAt ?? n.raw?.createdAt ?? '',
    n.errorMessage ?? '',
  ].map(escape))

  const csv = [headers.map(escape), ...rows].map(r => r.join(',')).join('\n')
  triggerDownload(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), filename)
}

export function exportToJSON(notifications, filename = 'notifications.json') {
  const json = JSON.stringify(notifications.map(n => n.raw ?? n), null, 2)
  triggerDownload(new Blob([json], { type: 'application/json' }), filename)
}

function triggerDownload(blob, filename) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: filename,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}
