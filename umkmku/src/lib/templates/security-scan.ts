export interface SecurityFlag {
  severity: 'critical' | 'warning'
  pattern: string
  file: string
  line?: number
}

export interface ScanReport {
  flags: SecurityFlag[]
  criticalCount: number
  warningCount: number
  scannedFiles: number
  manifestValid: boolean
  manifestData: Record<string, unknown> | null
  error?: string
}

// Dangerous patterns to scan in .tsx/.ts/.js files
const CRITICAL_PATTERNS = [
  { pattern: /\beval\s*\(/, label: 'eval()' },
  { pattern: /new\s+Function\s*\(/, label: 'Function constructor' },
  { pattern: /dangerouslySetInnerHTML/, label: 'dangerouslySetInnerHTML' },
  { pattern: /require\s*\(\s*['"]child_process['"]/, label: 'child_process import' },
  { pattern: /require\s*\(\s*['"]fs['"]/, label: 'fs module import' },
  { pattern: /\bexec\s*\(/, label: 'exec()' },
  { pattern: /\bspawn\s*\(/, label: 'spawn()' },
]

const WARNING_PATTERNS = [
  { pattern: /process\.env/, label: 'process.env access' },
  { pattern: /document\.write/, label: 'document.write' },
  { pattern: /<script\b/i, label: '<script> tag' },
  { pattern: /fetch\s*\(\s*['"`][^'"` ]*['"`]/, label: 'hardcoded fetch URL' },
  { pattern: /axios\s*\.\s*(get|post|put|delete)\s*\(\s*['"`][^'"` ]*['"`]/, label: 'hardcoded axios URL' },
]

const ALLOWED_EXTENSIONS = new Set(['.tsx', '.ts', '.js', '.jsx', '.css', '.json', '.md', '.svg', '.png', '.jpg', '.webp'])
const BLOCKED_EXTENSIONS = new Set(['.sh', '.bash', '.py', '.rb', '.php', '.exe', '.dll', '.so'])

// Fetch and scan a public GitHub repo via the API (no clone needed)
export async function scanGithubRepo(repoUrl: string): Promise<ScanReport> {
  const report: ScanReport = {
    flags: [],
    criticalCount: 0,
    warningCount: 0,
    scannedFiles: 0,
    manifestValid: false,
    manifestData: null,
  }

  try {
    // Parse owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/)
    if (!match) {
      report.error = 'URL bukan repo GitHub yang valid.'
      return report
    }

    const [, owner, repo] = match
    const apiBase = `https://api.github.com/repos/${owner}/${repo}`
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' }

    // 1. Check repo exists and is public
    const repoRes = await fetch(apiBase, { headers })
    if (!repoRes.ok) {
      report.error = `Repo tidak ditemukan atau bukan public (${repoRes.status}).`
      return report
    }
    const repoData = await repoRes.json() as { private?: boolean; size?: number }
    if (repoData.private) {
      report.error = 'Repo harus public.'
      return report
    }
    if ((repoData.size ?? 0) > 5120) { // 5MB in KB
      report.flags.push({ severity: 'warning', pattern: 'Repo size > 5MB', file: 'repo' })
    }

    // 2. Fetch manifest.json
    const manifestRes = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/main/manifest.json`,
      { headers }
    )
    if (!manifestRes.ok) {
      report.flags.push({ severity: 'critical', pattern: 'manifest.json tidak ditemukan di root repo', file: 'manifest.json' })
    } else {
      try {
        const manifest = await manifestRes.json() as Record<string, unknown>
        report.manifestData = manifest
        const required = ['name', 'category', 'version', 'entry_component']
        for (const field of required) {
          if (!manifest[field]) {
            report.flags.push({ severity: 'critical', pattern: `manifest.json missing field: ${field}`, file: 'manifest.json' })
          }
        }
        const validCategories = ['skincare', 'parfum', 'fashion', 'fdb']
        if (manifest.category && !validCategories.includes(manifest.category as string)) {
          report.flags.push({ severity: 'critical', pattern: `manifest.json category tidak valid: ${manifest.category}`, file: 'manifest.json' })
        }
        report.manifestValid = report.flags.filter(f => f.file === 'manifest.json' && f.severity === 'critical').length === 0
      } catch {
        report.flags.push({ severity: 'critical', pattern: 'manifest.json bukan JSON valid', file: 'manifest.json' })
      }
    }

    // 3. Fetch file tree
    const treeRes = await fetch(`${apiBase}/git/trees/HEAD?recursive=1`, { headers })
    if (!treeRes.ok) {
      report.error = 'Gagal membaca struktur repo.'
      return report
    }
    const tree = await treeRes.json() as { tree: Array<{ path: string; type: string; size?: number }> }
    const files = tree.tree.filter(f => f.type === 'blob')

    if (files.length > 200) {
      report.flags.push({ severity: 'warning', pattern: `Terlalu banyak file: ${files.length} (max 200)`, file: 'repo' })
    }

    // 4. Check for blocked file extensions
    for (const file of files) {
      const ext = '.' + (file.path.split('.').pop() ?? '')
      if (BLOCKED_EXTENSIONS.has(ext)) {
        report.flags.push({ severity: 'critical', pattern: `File berbahaya ditemukan: ${file.path}`, file: file.path })
      }
    }

    // 5. Scan content of .ts/.tsx/.js files
    const codeFiles = files.filter(f => {
      const ext = '.' + (f.path.split('.').pop() ?? '')
      return ['.ts', '.tsx', '.js', '.jsx'].includes(ext) && (f.size ?? 0) < 100_000
    }).slice(0, 50) // max 50 files

    for (const file of codeFiles) {
      try {
        const contentRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/main/${file.path}`,
          { headers }
        )
        if (!contentRes.ok) continue
        const content = await contentRes.text()
        report.scannedFiles++

        const lines = content.split('\n')
        for (const { pattern, label } of CRITICAL_PATTERNS) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              report.flags.push({ severity: 'critical', pattern: label, file: file.path, line: i + 1 })
              break // one flag per pattern per file
            }
          }
        }
        for (const { pattern, label } of WARNING_PATTERNS) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              report.flags.push({ severity: 'warning', pattern: label, file: file.path, line: i + 1 })
              break
            }
          }
        }
      } catch { /* skip unreadable file */ }
    }

    report.criticalCount = report.flags.filter(f => f.severity === 'critical').length
    report.warningCount = report.flags.filter(f => f.severity === 'warning').length

    return report
  } catch (err) {
    report.error = err instanceof Error ? err.message : 'Scan gagal.'
    return report
  }
}
