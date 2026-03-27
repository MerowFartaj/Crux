export type PreviewType = 'image' | 'markdown' | 'code' | 'json' | 'csv' | 'text' | 'pdf' | 'binary' | 'web';

export function isUrl(path: string): boolean {
  return /^https?:\/\//i.test(path) || /^localhost(:\d+)?/i.test(path);
}

export function normalizeUrl(url: string): string {
  if (/^localhost/i.test(url)) return `http://${url}`;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico']);
const MARKDOWN_EXTS = new Set(['md', 'mdx', 'markdown']);
const JSON_EXTS = new Set(['json', 'jsonc', 'json5']);
const CSV_EXTS = new Set(['csv', 'tsv']);
const PDF_EXTS = new Set(['pdf']);

const CODE_EXTS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'pyw', 'rb', 'php',
  'rs', 'go', 'c', 'cpp', 'cc', 'h', 'hpp',
  'java', 'kt', 'kts', 'scala', 'cs', 'swift',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'xml', 'svg', 'yaml', 'yml', 'toml', 'ini', 'cfg',
  'sh', 'bash', 'zsh', 'fish', 'ps1',
  'sql', 'graphql', 'gql',
  'dockerfile', 'makefile', 'cmake',
  'lua', 'vim', 'ex', 'exs', 'erl', 'hrl',
  'zig', 'nim', 'v', 'dart', 'r',
  'tf', 'hcl', 'proto',
]);

const CODE_FILENAMES = new Set([
  'Dockerfile', 'Makefile', 'CMakeLists.txt', 'Gemfile', 'Rakefile',
  'Vagrantfile', '.gitignore', '.gitattributes', '.editorconfig',
  '.env', '.env.local', '.env.production', '.eslintrc', '.prettierrc',
  'CLAUDE.md', 'README.md',
]);

export function getPreviewType(filePath: string): PreviewType {
  const name = filePath.split('/').pop() || '';
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : '';

  if (CODE_FILENAMES.has(name)) return 'code';
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (MARKDOWN_EXTS.has(ext)) return 'markdown';
  if (JSON_EXTS.has(ext)) return 'json';
  if (CSV_EXTS.has(ext)) return 'csv';
  if (PDF_EXTS.has(ext)) return 'pdf';
  if (CODE_EXTS.has(ext)) return 'code';

  return 'text';
}

export function getLanguage(filePath: string): string {
  const name = filePath.split('/').pop() || '';
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : '';

  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', pyw: 'python',
    rb: 'ruby', rs: 'rust', go: 'go',
    c: 'c', cpp: 'cpp', cc: 'cpp', h: 'c', hpp: 'cpp',
    java: 'java', kt: 'kotlin', cs: 'csharp', swift: 'swift',
    html: 'html', htm: 'html', css: 'css', scss: 'scss',
    xml: 'xml', yaml: 'yaml', yml: 'yaml',
    toml: 'toml', ini: 'ini', json: 'json',
    sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash',
    sql: 'sql', graphql: 'graphql',
    lua: 'lua', r: 'r', dart: 'dart',
    php: 'php', scala: 'scala',
    dockerfile: 'dockerfile', makefile: 'makefile',
  };

  if (name === 'Dockerfile') return 'dockerfile';
  if (name === 'Makefile' || name === 'CMakeLists.txt') return 'makefile';
  return map[ext] || 'plaintext';
}

export function getFileIcon(filePath: string): string {
  if (isUrl(filePath)) return '🌐';
  const type = getPreviewType(filePath);
  switch (type) {
    case 'image': return '🖼';
    case 'markdown': return '📝';
    case 'code': return '💻';
    case 'json': return '{}';
    case 'csv': return '📊';
    case 'pdf': return '📄';
    case 'text': return '📃';
    default: return '📁';
  }
}
