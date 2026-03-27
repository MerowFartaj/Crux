import React, { useEffect, useState, useRef } from 'react';

// Project-type → suggested commands
const PROJECT_COMMANDS: Record<string, string[]> = {
  node: [
    'npm install', 'npm start', 'npm test', 'npm run build', 'npm run dev',
    'npm run lint', 'npm run format', 'npm ci', 'npm outdated', 'npm update',
    'yarn install', 'yarn start', 'yarn build', 'yarn test',
    'pnpm install', 'pnpm dev', 'pnpm build', 'pnpm test',
    'npx', 'node',
  ],
  rust: [
    'cargo build', 'cargo run', 'cargo test', 'cargo check', 'cargo clippy',
    'cargo fmt', 'cargo doc', 'cargo bench', 'cargo add', 'cargo update',
    'rustup update',
  ],
  go: [
    'go build', 'go run .', 'go test ./...', 'go mod tidy', 'go mod download',
    'go fmt ./...', 'go vet ./...', 'go generate', 'go install',
  ],
  python: [
    'pip install -r requirements.txt', 'pip install', 'pip freeze',
    'python', 'python3', 'pytest', 'pytest -v', 'python -m venv .venv',
    'source .venv/bin/activate', 'pip install -e .',
  ],
  docker: [
    'docker-compose up', 'docker-compose up -d', 'docker-compose down',
    'docker-compose build', 'docker-compose logs -f',
    'docker build .', 'docker ps', 'docker images', 'docker exec -it',
  ],
  ruby: [
    'bundle install', 'bundle exec', 'rails server', 'rails console',
    'rake', 'gem install',
  ],
  make: [
    'make', 'make clean', 'make install', 'make test', 'make all',
    'make build', 'make check',
  ],
  cmake: [
    'cmake .', 'cmake --build .', 'cmake -B build', 'cmake --build build',
  ],
  git: [
    'git status', 'git pull', 'git push', 'git add .', 'git commit -m ""',
    'git log --oneline', 'git diff', 'git branch', 'git checkout',
    'git stash', 'git stash pop', 'git rebase', 'git merge',
  ],
};

interface AutocompleteProps {
  currentInput: string;
  visible: boolean;
  onAccept: (completion: string) => void;
  tabId: string;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  currentInput,
  visible,
  onAccept,
  tabId,
}) => {
  const [suggestion, setSuggestion] = useState('');
  const [source, setSource] = useState<'history' | 'project' | ''>('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const projectCacheRef = useRef<{ cwd: string; types: string[] } | null>(null);

  useEffect(() => {
    if (!visible || !currentInput || currentInput.length < 2) {
      setSuggestion('');
      setSource('');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        // 1. Try history first
        const results = await window.electronAPI.db.search(currentInput, 5);
        const histMatch = results.find((r) =>
          r.command.toLowerCase().startsWith(currentInput.toLowerCase()) &&
          r.command.length > currentInput.length
        );

        if (histMatch) {
          setSuggestion(histMatch.command.slice(currentInput.length));
          setSource('history');
          return;
        }

        // 2. Try project-aware suggestions
        const cwd = await window.electronAPI.pty.getCwd(tabId);
        let projectTypes: string[];

        // Cache project detection per cwd
        if (projectCacheRef.current?.cwd === cwd) {
          projectTypes = projectCacheRef.current.types;
        } else {
          projectTypes = await window.electronAPI.pty.detectProject(cwd);
          projectCacheRef.current = { cwd, types: projectTypes };
        }

        // Search project commands
        const input = currentInput.toLowerCase();
        for (const type of projectTypes) {
          const cmds = PROJECT_COMMANDS[type] || [];
          const match = cmds.find(c => c.toLowerCase().startsWith(input) && c.length > currentInput.length);
          if (match) {
            setSuggestion(match.slice(currentInput.length));
            setSource('project');
            return;
          }
        }

        setSuggestion('');
        setSource('');
      } catch {
        setSuggestion('');
        setSource('');
      }
    }, 100);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentInput, visible, tabId]);

  // Tab key to accept suggestion
  useEffect(() => {
    if (!suggestion) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        e.stopPropagation();
        onAccept(suggestion);
        setSuggestion('');
        setSource('');
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [suggestion, onAccept]);

  if (!suggestion) return null;

  return (
    <div className="absolute bottom-1 left-2 pointer-events-none z-40">
      <div className="flex items-center gap-2 bg-[#12121A]/90 border border-[#1E1E2E] rounded px-2 py-1">
        <span className="text-xs font-mono text-[#64748B]">
          {currentInput}
          <span className="text-[#3B82F6]/60">{suggestion}</span>
        </span>
        {source === 'project' && (
          <span className="text-[8px] text-[#06B6D4] bg-[#06B6D4]/10 px-1 py-0.5 rounded">
            ctx
          </span>
        )}
        <kbd className="text-[9px] text-[#64748B] bg-[#1E1E2E] px-1 py-0.5 rounded">
          Tab
        </kbd>
      </div>
    </div>
  );
};

export default Autocomplete;
