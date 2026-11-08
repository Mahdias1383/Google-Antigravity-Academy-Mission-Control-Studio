/**
 * Repository Integrity & Domain Whitelist Validator
 * 
 * Specifically audits and validates the file system structure for:
 * 'Google-Antigravity-Academy-Mission-Control-Studio'
 * 
 * Verifies all file paths against a strict domain whitelist and flags any foreign
 * remnants, cross-project residue, or files originating from 'management_system' / 'railpulse'.
 */

export interface DomainFileWhitelistConfig {
  allowedDirectories: string[];
  allowedExactFiles: string[];
  forbiddenPatternKeywords: string[];
  allowedFileExtensions: string[];
}

export interface FileAuditIssue {
  filePath: string;
  severity: 'critical' | 'warning';
  reasonFa: string;
  reasonEn: string;
  matchedForbiddenKeyword?: string;
}

export interface DomainAuditReport {
  isCompliant: boolean;
  totalFilesAudited: number;
  validFilesCount: number;
  flaggedIssuesCount: number;
  issues: FileAuditIssue[];
  auditedDomain: string;
  timestampIso: string;
}

/**
 * Standard Whitelist for Google Antigravity Academy & Mission Control Studio
 */
export const ANTIGRAVITY_ACADEMY_WHITELIST_CONFIG: DomainFileWhitelistConfig = {
  allowedDirectories: [
    'src',
    'src/components',
    'src/studios',
    'src/utils',
    'src/types',
    'src/data',
    'src/lib',
    'src/context',
    'public',
    'public/fonts',
    'public/assets',
    'public/assets/aistudio',
    '.github',
    '.github/workflows',
    '.aistudio',
    '.aistudio/artifacts',
    'dist',
    'dist/assets',
    'dist/fonts',
    'dev-dist',
    'node_modules',
    '.playwright-cli',
  ],
  allowedExactFiles: [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'metadata.json',
    'index.html',
    'server.ts',
    'eslint.config.js',
    'firestore.rules',
    'firestore.rules.test.ts',
    'firebase-blueprint.json',
    'firebase-applet-config.json',
    'README.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'security_spec.md',
    '.env.example',
    '.gitignore',
    'bun.lock',
  ],
  forbiddenPatternKeywords: [
    'railpulse',
    'checkaccident',
    'marey',
    'trainline',
    'trainschedule',
    'stationnode',
    'management_system',
    'passengerportal',
    'operationsportal',
    'adminportal',
    'bookingengine',
    'collisionengine',
    'idlesessionservice',
    'auditlogviewer',
  ],
  allowedFileExtensions: [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.html',
    '.css',
    '.md',
    '.woff2',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.ico',
    '.rules',
    '.example',
    '.yml',
    '.yaml',
    '.lock',
  ],
};

/**
 * Normalizes relative path to POSIX style (e.g. "./src/App.tsx" -> "src/App.tsx")
 */
export function normalizeRelativePath(rawPath: string): string {
  let cleaned = rawPath.replace(/\\/g, '/').trim();
  if (cleaned.startsWith('./')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith('/')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Evaluates a single file path against domain whitelist rules
 */
export function evaluateFilePathCompliance(
  filePath: string,
  config: DomainFileWhitelistConfig = ANTIGRAVITY_ACADEMY_WHITELIST_CONFIG
): FileAuditIssue | null {
  const normalized = normalizeRelativePath(filePath);
  const lower = normalized.toLowerCase();

  // 1. Check for explicit forbidden domain keywords (Management System / RailPulse)
  for (const keyword of config.forbiddenPatternKeywords) {
    if (lower.includes(keyword)) {
      return {
        filePath: normalized,
        severity: 'critical',
        matchedForbiddenKeyword: keyword,
        reasonEn: `File contains forbidden keyword "${keyword}" originating from legacy 'management_system'`,
        reasonFa: `فایل شامل کلیدواژه غیرمجاز "${keyword}" متعلق به پروژه management_system است`,
      };
    }
  }

  // 2. Check if it's an allowed root exact file
  if (!normalized.includes('/')) {
    if (config.allowedExactFiles.includes(normalized)) {
      return null;
    }
    // Allow hidden config files like .gitignore
    if (normalized.startsWith('.') && config.allowedExactFiles.some(f => f.toLowerCase() === normalized.toLowerCase())) {
      return null;
    }
    return {
      filePath: normalized,
      severity: 'warning',
      reasonEn: `Root file "${normalized}" is not in the whitelist for Google Antigravity Academy`,
      reasonFa: `فایل در ریشه پروژه "${normalized}" در لیست مجاز آکادمی آنتی‌گرویتی تعریف نشده است`,
    };
  }

  // 3. Check directory hierarchy
  const dirPath = normalized.substring(0, normalized.lastIndexOf('/'));
  const isAllowedDirectory = config.allowedDirectories.some(
    allowedDir => dirPath === allowedDir || dirPath.startsWith(`${allowedDir}/`)
  );

  if (!isAllowedDirectory) {
    return {
      filePath: normalized,
      severity: 'critical',
      reasonEn: `Directory "${dirPath}" is not an authorized folder for Antigravity Academy`,
      reasonFa: `دایرکتوری "${dirPath}" جزو ساختار مجاز آکادمی آنتی‌گرویتی نمی‌باشد`,
    };
  }

  // 4. Check file extension
  const ext = normalized.substring(normalized.lastIndexOf('.')).toLowerCase();
  if (!config.allowedFileExtensions.includes(ext)) {
    return {
      filePath: normalized,
      severity: 'warning',
      reasonEn: `File extension "${ext}" is not recognized in allowed file types`,
      reasonFa: `پسوند فایل "${ext}" در فرمت‌های معتبر پروژه شناسایی نشد`,
    };
  }

  return null;
}

/**
 * Validates a list of file paths against the whitelist
 */
export function validateFileListAgainstDomainWhitelist(
  filePaths: string[],
  config: DomainFileWhitelistConfig = ANTIGRAVITY_ACADEMY_WHITELIST_CONFIG
): DomainAuditReport {
  const issues: FileAuditIssue[] = [];

  for (const p of filePaths) {
    // Ignore internal temporary lock/cache files if in node_modules or .git
    const normalized = normalizeRelativePath(p);
    if (normalized.startsWith('.git/') || normalized.startsWith('node_modules/')) {
      continue;
    }

    const issue = evaluateFilePathCompliance(p, config);
    if (issue) {
      issues.push(issue);
    }
  }

  return {
    isCompliant: issues.length === 0,
    totalFilesAudited: filePaths.length,
    validFilesCount: filePaths.length - issues.length,
    flaggedIssuesCount: issues.length,
    issues,
    auditedDomain: 'Google-Antigravity-Academy-Mission-Control-Studio',
    timestampIso: new Date().toISOString(),
  };
}

/**
 * Node.js filesystem scanner: Recursively inspects a directory and returns compliance report
 */
export async function auditDirectoryCompliance(
  rootDirectory: string = process.cwd(),
  config: DomainFileWhitelistConfig = ANTIGRAVITY_ACADEMY_WHITELIST_CONFIG
): Promise<DomainAuditReport> {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const gatheredFiles: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(rootDirectory, fullPath).replace(/\\/g, '/');

      // Skip node_modules and .git internals for rapid deterministic audits
      if (relPath.startsWith('node_modules') || relPath.startsWith('.git')) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        gatheredFiles.push(relPath);
      }
    }
  }

  try {
    walk(rootDirectory);
  } catch (err) {
    console.error('Error walking directory for compliance audit:', err);
  }

  return validateFileListAgainstDomainWhitelist(gatheredFiles, config);
}
