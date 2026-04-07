import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import pino from 'pino';
import ignore, { type Ignore } from 'ignore';
import { type GraphAdapter } from '../core/graph.js';

const logger = pino({ name: 'code-drift' });

// ── Types ──

export interface ImportStatement {
  symbol: string;
  package: string;
  filePath: string;
  line: number;
  kind: 'named' | 'default' | 'namespace' | 'require' | 'python' | 'csharp' | 'powershell';
}

export interface MissingDocEntry {
  symbol: string;
  package: string;
  files: string[];
  line_numbers: number[];
  crawl_queued: boolean;
}

export interface DeprecatedEntry {
  symbol: string;
  package: string;
  files: string[];
  line_numbers: number[];
  deprecated_since: string;
  replacement: string;
}

export interface StaleDocEntry {
  symbol: string;
  package: string;
  doc_updated: string;
  last_code_scan: string;
  files: string[];
}

export interface CodeDriftReport {
  missing_docs: MissingDocEntry[];
  deprecated_usage: DeprecatedEntry[];
  stale_docs: StaleDocEntry[];
  scan_timestamp: string;
  files_scanned: number;
  duration_ms: number;
}

// ── Import Parsing Regex Patterns ──

const TS_NAMED_IMPORT = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
const TS_DEFAULT_IMPORT = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
const TS_NAMESPACE_IMPORT = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
const REQUIRE_IMPORT = /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g;
const PY_IMPORT = /^import\s+([\w.]+)/gm;
const PY_FROM_IMPORT = /^from\s+([\w.]+)\s+import\s+(.+)/gm;
const CSHARP_USING = /^using\s+([\w.]+)\s*;/gm;
const PS_IMPORT_MODULE = /^Import-Module\s+(?:-Name\s+)?['"]?(\S+?)['"]?\s*$/gm;
const PS_USING_MODULE = /^using\s+module\s+['"]?(\S+?)['"]?\s*$/gm;

const SCANNABLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py',
  '.cs',
  '.ps1', '.psm1',
]);

// ── Scanner ──

export class CodeDriftScanner {
  private readonly graph: GraphAdapter;
  private readonly projectRoot: string;

  constructor(graph: GraphAdapter, projectRoot: string) {
    this.graph = graph;
    this.projectRoot = projectRoot;
  }

  async scan(): Promise<CodeDriftReport> {
    const startTime = Date.now();
    const scanTimestamp = new Date().toISOString();

    logger.info({ projectRoot: this.projectRoot }, 'Starting code drift scan');

    const ig = await this.loadGitignore();
    const files = await this.walkDirectory(this.projectRoot, ig);

    logger.info({ fileCount: files.length }, 'Files discovered for scanning');

    const allImports: ImportStatement[] = [];

    for (const filePath of files) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const imports = this.parseImports(filePath, content);
        allImports.push(...imports);
      } catch (err) {
        logger.debug({ filePath, err }, 'Failed to read file for import scan');
      }
    }

    const missingDocs = await this.findMissingDocs(allImports);
    const deprecatedUsage = await this.findDeprecatedUsage(allImports);
    const staleDocs = await this.findStaleDocs(allImports);

    const durationMs = Date.now() - startTime;

    const report: CodeDriftReport = {
      missing_docs: missingDocs,
      deprecated_usage: deprecatedUsage,
      stale_docs: staleDocs,
      scan_timestamp: scanTimestamp,
      files_scanned: files.length,
      duration_ms: durationMs,
    };

    logger.info({
      filesScanned: files.length,
      missingDocs: missingDocs.length,
      deprecated: deprecatedUsage.length,
      stale: staleDocs.length,
      durationMs,
    }, 'Code drift scan complete');

    return report;
  }

  parseImports(filePath: string, content: string): ImportStatement[] {
    const ext = extname(filePath).toLowerCase();
    const results: ImportStatement[] = [];

    if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
      results.push(...this.parseJsImports(filePath, content));
    } else if (ext === '.py') {
      results.push(...this.parsePythonImports(filePath, content));
    } else if (ext === '.cs') {
      results.push(...this.parseCsharpImports(filePath, content));
    } else if (ext === '.ps1' || ext === '.psm1') {
      results.push(...this.parsePowershellImports(filePath, content));
    }

    return results;
  }

  // ── Private Methods ──

  private parseJsImports(filePath: string, content: string): ImportStatement[] {
    const results: ImportStatement[] = [];
    const lines = content.split('\n');

    // Named imports: import { X, Y } from 'pkg'
    for (const match of content.matchAll(TS_NAMED_IMPORT)) {
      const symbolsRaw = match[1] ?? '';
      const pkg = match[2] ?? '';
      const lineNum = this.findLineNumber(lines, match.index ?? 0);
      const symbols = symbolsRaw
        .split(',')
        .map((s) => s.trim().split(/\s+as\s+/)[0]?.trim())
        .filter((s): s is string => !!s);

      for (const symbol of symbols) {
        results.push({
          symbol,
          package: pkg,
          filePath,
          line: lineNum,
          kind: 'named',
        });
      }
    }

    // Default imports: import X from 'pkg'
    for (const match of content.matchAll(TS_DEFAULT_IMPORT)) {
      const symbol = match[1] ?? '';
      const pkg = match[2] ?? '';
      // Skip if this was actually a named or namespace import
      if (symbol === '*' || symbol === '{') continue;
      const lineNum = this.findLineNumber(lines, match.index ?? 0);
      results.push({ symbol, package: pkg, filePath, line: lineNum, kind: 'default' });
    }

    // Namespace imports: import * as X from 'pkg'
    for (const match of content.matchAll(TS_NAMESPACE_IMPORT)) {
      const symbol = match[1] ?? '';
      const pkg = match[2] ?? '';
      const lineNum = this.findLineNumber(lines, match.index ?? 0);
      results.push({ symbol, package: pkg, filePath, line: lineNum, kind: 'namespace' });
    }

    // Require imports: const X = require('pkg')
    for (const match of content.matchAll(REQUIRE_IMPORT)) {
      const destructured = match[1];
      const direct = match[2];
      const pkg = match[3] ?? '';
      const lineNum = this.findLineNumber(lines, match.index ?? 0);

      if (destructured) {
        const symbols = destructured
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const symbol of symbols) {
          results.push({ symbol, package: pkg, filePath, line: lineNum, kind: 'require' });
        }
      } else if (direct) {
        results.push({ symbol: direct, package: pkg, filePath, line: lineNum, kind: 'require' });
      }
    }

    return results;
  }

  private parsePythonImports(filePath: string, content: string): ImportStatement[] {
    const results: ImportStatement[] = [];
    const lines = content.split('\n');

    // import X.Y.Z
    for (const match of content.matchAll(PY_IMPORT)) {
      const pkg = match[1] ?? '';
      const lineNum = this.findLineNumber(lines, match.index ?? 0);
      const parts = pkg.split('.');
      const symbol = parts[parts.length - 1] ?? pkg;
      results.push({ symbol, package: pkg, filePath, line: lineNum, kind: 'python' });
    }

    // from X import Y, Z
    for (const match of content.matchAll(PY_FROM_IMPORT)) {
      const pkg = match[1] ?? '';
      const symbolsRaw = match[2] ?? '';
      const lineNum = this.findLineNumber(lines, match.index ?? 0);
      const symbols = symbolsRaw
        .split(',')
        .map((s) => s.trim().split(/\s+as\s+/)[0]?.trim())
        .filter((s): s is string => !!s);

      for (const symbol of symbols) {
        results.push({ symbol, package: pkg, filePath, line: lineNum, kind: 'python' });
      }
    }

    return results;
  }

  private parseCsharpImports(filePath: string, content: string): ImportStatement[] {
    const results: ImportStatement[] = [];
    const lines = content.split('\n');

    for (const match of content.matchAll(CSHARP_USING)) {
      const namespace = match[1] ?? '';
      const lineNum = this.findLineNumber(lines, match.index ?? 0);
      const parts = namespace.split('.');
      const symbol = parts[parts.length - 1] ?? namespace;
      results.push({ symbol, package: namespace, filePath, line: lineNum, kind: 'csharp' });
    }

    return results;
  }

  private parsePowershellImports(filePath: string, content: string): ImportStatement[] {
    const results: ImportStatement[] = [];
    const lines = content.split('\n');

    // Import-Module <Name>
    for (const match of content.matchAll(PS_IMPORT_MODULE)) {
      const moduleName = match[1] ?? '';
      const lineNum = this.findLineNumber(lines, match.index ?? 0);
      results.push({ symbol: moduleName, package: moduleName, filePath, line: lineNum, kind: 'powershell' });
    }

    // using module <Name>
    for (const match of content.matchAll(PS_USING_MODULE)) {
      const moduleName = match[1] ?? '';
      const lineNum = this.findLineNumber(lines, match.index ?? 0);
      results.push({ symbol: moduleName, package: moduleName, filePath, line: lineNum, kind: 'powershell' });
    }

    return results;
  }

  private findLineNumber(lines: string[], charIndex: number): number {
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineContent = lines[i];
      if (lineContent === undefined) break;
      count += lineContent.length + 1; // +1 for newline
      if (count > charIndex) return i + 1;
    }
    return 1;
  }

  private async findMissingDocs(imports: ImportStatement[]): Promise<MissingDocEntry[]> {
    // Group imports by package+symbol
    const grouped = this.groupImports(imports);
    const missing: MissingDocEntry[] = [];

    for (const [, entries] of grouped) {
      const firstEntry = entries[0];
      if (!firstEntry) continue;

      // Skip relative imports and node built-ins
      if (firstEntry.package.startsWith('.') || firstEntry.package.startsWith('node:')) {
        continue;
      }

      // Check if symbol is in the graph
      const searchResults = await this.graph.search(firstEntry.symbol, 1);
      const found = searchResults.some(
        (r) => r.name.toLowerCase() === firstEntry.symbol.toLowerCase(),
      );

      if (!found) {
        missing.push({
          symbol: firstEntry.symbol,
          package: firstEntry.package,
          files: [...new Set(entries.map((e) => relative(this.projectRoot, e.filePath)))],
          line_numbers: entries.map((e) => e.line),
          crawl_queued: false,
        });
      }
    }

    return missing;
  }

  private async findDeprecatedUsage(imports: ImportStatement[]): Promise<DeprecatedEntry[]> {
    const grouped = this.groupImports(imports);
    const deprecated: DeprecatedEntry[] = [];

    for (const [_key, entries] of grouped) {
      const firstEntry = entries[0];
      if (!firstEntry) continue;

      if (firstEntry.package.startsWith('.') || firstEntry.package.startsWith('node:')) {
        continue;
      }

      // Check graph for deprecated symbols
      const symbolNodes = await this.graph.search(firstEntry.symbol, 5);
      for (const result of symbolNodes) {
        const node = await this.graph.getNode(result.id);
        if (!node) continue;

        const isDeprecated = node.props['deprecated'] === true;
        if (isDeprecated) {
          deprecated.push({
            symbol: firstEntry.symbol,
            package: firstEntry.package,
            files: [...new Set(entries.map((e) => relative(this.projectRoot, e.filePath)))],
            line_numbers: entries.map((e) => e.line),
            deprecated_since: (node.props['deprecated_since'] as string) || 'unknown',
            replacement: (node.props['replacement'] as string) || 'none specified',
          });
          break;
        }
      }
    }

    return deprecated;
  }

  private async findStaleDocs(imports: ImportStatement[]): Promise<StaleDocEntry[]> {
    const grouped = this.groupImports(imports);
    const stale: StaleDocEntry[] = [];
    const now = new Date().toISOString();

    for (const [_key, entries] of grouped) {
      const firstEntry = entries[0];
      if (!firstEntry) continue;

      if (firstEntry.package.startsWith('.') || firstEntry.package.startsWith('node:')) {
        continue;
      }

      // Check graph for stale symbols
      const symbolNodes = await this.graph.search(firstEntry.symbol, 5);
      for (const result of symbolNodes) {
        const node = await this.graph.getNode(result.id);
        if (!node) continue;

        const isStale = node.props['stale'] === true;
        if (isStale) {
          stale.push({
            symbol: firstEntry.symbol,
            package: firstEntry.package,
            doc_updated: (node.props['last_crawled'] as string) || 'unknown',
            last_code_scan: now,
            files: [...new Set(entries.map((e) => relative(this.projectRoot, e.filePath)))],
          });
          break;
        }
      }
    }

    return stale;
  }

  private groupImports(imports: ImportStatement[]): Map<string, ImportStatement[]> {
    const map = new Map<string, ImportStatement[]>();
    for (const imp of imports) {
      const key = `${imp.package}::${imp.symbol}`;
      const existing = map.get(key);
      if (existing) {
        existing.push(imp);
      } else {
        map.set(key, [imp]);
      }
    }
    return map;
  }

  private async loadGitignore(): Promise<Ignore> {
    const ig = ignore();
    ig.add('node_modules');
    ig.add('.git');
    ig.add('dist');
    ig.add('build');
    ig.add('coverage');

    try {
      const gitignorePath = join(this.projectRoot, '.gitignore');
      const content = await readFile(gitignorePath, 'utf-8');
      ig.add(content);
    } catch {
      // No .gitignore, use defaults only
    }

    return ig;
  }

  private async walkDirectory(dir: string, ig: Ignore): Promise<string[]> {
    const results: string[] = [];

    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      return results;
    }

    for (const name of names) {
      const fullPath = join(dir, name);
      const relativePath = relative(this.projectRoot, fullPath);

      if (ig.ignores(relativePath)) continue;

      let fileStat;
      try {
        fileStat = await stat(fullPath);
      } catch {
        continue;
      }

      if (fileStat.isDirectory()) {
        if (name === 'node_modules' || name === '.git') continue;
        const subResults = await this.walkDirectory(fullPath, ig);
        results.push(...subResults);
      } else if (fileStat.isFile()) {
        const ext = extname(name).toLowerCase();
        if (SCANNABLE_EXTENSIONS.has(ext)) {
          results.push(fullPath);
        }
      }
    }

    return results;
  }
}
