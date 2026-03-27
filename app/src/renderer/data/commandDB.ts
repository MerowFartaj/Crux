export interface CommandEntry {
  description: string;
  subcommands?: Record<string, string>;
  flags?: Record<string, string>;
}

export interface SubcommandEntry {
  description: string;
  flags?: Record<string, string>;
}

export interface FullCommandEntry {
  description: string;
  subcommands?: Record<string, SubcommandEntry>;
  flags?: Record<string, string>;
}

const commandDB: Record<string, FullCommandEntry> = {
  // ========== GIT ==========
  git: {
    description: 'Distributed version control system',
    subcommands: {
      add: { description: 'Stage file contents for the next commit', flags: { '-A': 'Stage all changes including untracked', '-p': 'Interactively select hunks to stage', '-u': 'Stage modifications and deletions only', '.': 'Stage all changes in current directory' } },
      commit: { description: 'Record changes to the repository', flags: { '-m': 'Specify commit message inline', '-a': 'Automatically stage modified files', '--amend': 'Modify the most recent commit', '--no-edit': 'Amend without editing the message', '-s': 'Add Signed-off-by trailer', '--allow-empty': 'Allow creating a commit with no changes' } },
      push: { description: 'Upload local commits to a remote repository', flags: { '-u': 'Set upstream tracking branch', '--force': 'Force push (overwrites remote)', '-f': 'Force push (short)', '--force-with-lease': 'Safer force push', '--tags': 'Push all tags', '--delete': 'Delete a remote branch' } },
      pull: { description: 'Fetch and integrate changes from a remote', flags: { '--rebase': 'Rebase instead of merge', '--ff-only': 'Only fast-forward merge', '--no-rebase': 'Force merge instead of rebase', '--autostash': 'Stash changes before pull' } },
      switch: { description: 'Switch to a different branch', flags: { '-c': 'Create a new branch and switch to it', '-C': 'Create/reset a branch and switch', '-d': 'Switch to a detached HEAD', '--discard-changes': 'Discard local changes' } },
      checkout: { description: 'Switch branches or restore files', flags: { '-b': 'Create a new branch and switch', '-B': 'Create/reset a branch and switch', '--': 'Separate branch from file paths', '-f': 'Force checkout, discarding changes' } },
      branch: { description: 'List, create, or delete branches', flags: { '-d': 'Delete a fully merged branch', '-D': 'Force delete a branch', '-m': 'Rename the current branch', '-a': 'List all branches (local + remote)', '-r': 'List remote branches', '-v': 'Show branch with last commit', '--merged': 'List branches merged into HEAD' } },
      merge: { description: 'Join two or more development histories', flags: { '--squash': 'Squash commits into one', '--no-ff': 'Create a merge commit even if fast-forward', '--abort': 'Abort the merge operation', '--continue': 'Continue after resolving conflicts' } },
      rebase: { description: 'Reapply commits on top of another base', flags: { '-i': 'Interactive rebase', '--onto': 'Rebase onto a specific branch', '--abort': 'Abort the rebase', '--continue': 'Continue after resolving conflicts', '--skip': 'Skip the current patch' } },
      stash: { description: 'Stash changes in a dirty working directory', flags: { 'push': 'Stash current changes', 'pop': 'Apply and remove latest stash', 'list': 'List all stashes', 'drop': 'Remove a stash entry', 'apply': 'Apply stash without removing', 'show': 'Show stash contents', '-u': 'Include untracked files', '-m': 'Add a message to the stash' } },
      log: { description: 'Show commit history', flags: { '--oneline': 'One line per commit', '--graph': 'Show ASCII branch graph', '-n': 'Limit to last N commits', '--all': 'Show all branches', '--stat': 'Show file change stats', '-p': 'Show patches (diffs)', '--since': 'Commits after a date', '--author': 'Filter by author' } },
      diff: { description: 'Show changes between commits or working tree', flags: { '--staged': 'Show staged changes', '--cached': 'Same as --staged', '--stat': 'Show diffstat summary', '--name-only': 'Show only changed file names', '--no-index': 'Compare two paths outside git', '-w': 'Ignore whitespace changes' } },
      status: { description: 'Show the working tree status', flags: { '-s': 'Short format output', '-b': 'Show branch info in short format', '--porcelain': 'Machine-readable output', '-u': 'Show untracked files' } },
      clone: { description: 'Clone a repository into a new directory', flags: { '--depth': 'Shallow clone with N commits', '--branch': 'Clone a specific branch', '--recursive': 'Initialize submodules', '--bare': 'Clone as a bare repository', '--single-branch': 'Clone only one branch' } },
      fetch: { description: 'Download objects and refs from a remote', flags: { '--all': 'Fetch all remotes', '--prune': 'Remove deleted remote branches', '--tags': 'Fetch all tags', '--depth': 'Deepen a shallow repository' } },
      reset: { description: 'Reset current HEAD to a specified state', flags: { '--soft': 'Keep changes staged', '--mixed': 'Keep changes unstaged (default)', '--hard': 'Discard all changes', 'HEAD~1': 'Reset to previous commit' } },
      revert: { description: 'Create a new commit that undoes a previous commit', flags: { '--no-commit': 'Revert without auto-committing', '-m': 'Specify mainline parent for merge commits' } },
      'cherry-pick': { description: 'Apply changes from specific commits', flags: { '--no-commit': 'Apply without committing', '-x': 'Append cherry-pick source info', '--abort': 'Abort cherry-pick operation' } },
      tag: { description: 'Create, list, delete, or verify tags', flags: { '-a': 'Create an annotated tag', '-m': 'Tag message', '-d': 'Delete a tag', '-l': 'List tags matching pattern', '-f': 'Force replace existing tag' } },
      remote: { description: 'Manage remote repository connections', flags: { '-v': 'Show remote URLs', 'add': 'Add a new remote', 'remove': 'Remove a remote', 'rename': 'Rename a remote' } },
      init: { description: 'Create an empty Git repository', flags: { '--bare': 'Create a bare repository', '-b': 'Set initial branch name' } },
    },
    flags: { '--version': 'Show git version', '--help': 'Show help', '-C': 'Run as if started in the given path' },
  },

  // ========== NPM ==========
  npm: {
    description: 'Node.js package manager',
    subcommands: {
      install: { description: 'Install all dependencies or a specific package', flags: { '--save-dev': 'Save as dev dependency', '-D': 'Save as dev dependency (short)', '--save-exact': 'Save with exact version', '--global': 'Install globally', '-g': 'Install globally (short)', '--legacy-peer-deps': 'Ignore peer dependency conflicts', '--force': 'Force install' } },
      run: { description: 'Run a script defined in package.json', flags: { '--silent': 'Suppress output', '--if-present': 'Skip if script not found' } },
      test: { description: 'Run the test script from package.json', flags: { '--': 'Pass arguments to the test runner' } },
      start: { description: 'Run the start script from package.json', flags: {} },
      build: { description: 'Run the build script from package.json', flags: {} },
      init: { description: 'Create a new package.json file', flags: { '-y': 'Accept all defaults', '--scope': 'Set the package scope' } },
      publish: { description: 'Publish a package to the registry', flags: { '--access': 'Set package access level (public/restricted)', '--tag': 'Publish with a specific dist-tag', '--dry-run': 'Simulate publish without uploading' } },
      update: { description: 'Update installed packages', flags: { '-g': 'Update global packages', '--save': 'Save updated versions to package.json' } },
      audit: { description: 'Run a security audit of dependencies', flags: { 'fix': 'Automatically fix vulnerabilities', '--production': 'Only audit production dependencies' } },
      uninstall: { description: 'Remove a package', flags: { '-g': 'Remove global package', '--save': 'Remove from dependencies' } },
      ci: { description: 'Clean install from lockfile (for CI)', flags: {} },
      outdated: { description: 'Check for outdated packages', flags: { '-g': 'Check global packages' } },
      ls: { description: 'List installed packages', flags: { '--depth': 'Set tree depth', '-g': 'List global packages', '--json': 'Output as JSON' } },
    },
    flags: { '--version': 'Show npm version', '--help': 'Show help' },
  },

  // ========== YARN ==========
  yarn: {
    description: 'Fast, reliable JavaScript package manager',
    subcommands: {
      add: { description: 'Add a package dependency', flags: { '--dev': 'Add as dev dependency', '-D': 'Add as dev dependency (short)', '--peer': 'Add as peer dependency', '--exact': 'Add with exact version' } },
      remove: { description: 'Remove a package dependency', flags: {} },
      install: { description: 'Install all dependencies', flags: { '--frozen-lockfile': 'Fail if lockfile needs update', '--production': 'Skip dev dependencies' } },
      build: { description: 'Run the build script', flags: {} },
      test: { description: 'Run the test script', flags: {} },
      start: { description: 'Run the start script', flags: {} },
    },
    flags: { '--version': 'Show yarn version' },
  },

  // ========== PNPM ==========
  pnpm: {
    description: 'Fast, disk-efficient package manager',
    subcommands: {
      install: { description: 'Install all dependencies', flags: { '--frozen-lockfile': 'Fail if lockfile needs update', '--prod': 'Skip dev dependencies' } },
      add: { description: 'Add a package dependency', flags: { '-D': 'Add as dev dependency', '-g': 'Install globally', '--save-exact': 'Save exact version' } },
      remove: { description: 'Remove a package', flags: {} },
      run: { description: 'Run a script from package.json', flags: {} },
      dev: { description: 'Run the dev script', flags: {} },
      build: { description: 'Run the build script', flags: {} },
      test: { description: 'Run the test script', flags: {} },
    },
    flags: { '--version': 'Show pnpm version' },
  },

  // ========== CARGO ==========
  cargo: {
    description: 'Rust package manager and build tool',
    subcommands: {
      build: { description: 'Compile the current package', flags: { '--release': 'Build with optimizations', '--target': 'Build for a specific target', '-p': 'Build a specific package', '--all': 'Build all packages in workspace' } },
      run: { description: 'Build and run the current package', flags: { '--release': 'Run with optimizations', '--example': 'Run an example', '--bin': 'Run a specific binary' } },
      test: { description: 'Run tests', flags: { '--release': 'Test with optimizations', '--lib': 'Test only library', '--doc': 'Run doc tests', '--no-run': 'Compile but do not run', '-- --nocapture': 'Show test output' } },
      check: { description: 'Check for errors without building', flags: { '--all-targets': 'Check all targets' } },
      clippy: { description: 'Run the Clippy linter', flags: { '--fix': 'Auto-fix warnings', '--': 'Pass args to clippy' } },
      fmt: { description: 'Format code with rustfmt', flags: { '--check': 'Check formatting without changing' } },
      new: { description: 'Create a new Cargo project', flags: { '--lib': 'Create a library project', '--name': 'Set the package name' } },
      init: { description: 'Initialize Cargo in an existing directory', flags: { '--lib': 'Initialize as library' } },
      add: { description: 'Add a dependency to Cargo.toml', flags: { '--dev': 'Add as dev dependency', '--features': 'Enable specific features' } },
      publish: { description: 'Publish a crate to crates.io', flags: { '--dry-run': 'Simulate without uploading', '--allow-dirty': 'Allow uncommitted changes' } },
      update: { description: 'Update dependencies in Cargo.lock', flags: { '-p': 'Update a specific package' } },
      doc: { description: 'Build documentation', flags: { '--open': 'Open docs in browser', '--no-deps': 'Skip dependency docs' } },
      bench: { description: 'Run benchmarks', flags: {} },
      clean: { description: 'Remove build artifacts', flags: {} },
    },
    flags: { '--version': 'Show cargo version', '-V': 'Show cargo version (short)' },
  },

  // ========== DOCKER ==========
  docker: {
    description: 'Container platform for building and running applications',
    subcommands: {
      build: { description: 'Build a Docker image from a Dockerfile', flags: { '-t': 'Tag the image (name:tag)', '-f': 'Specify Dockerfile path', '--no-cache': 'Build without layer cache', '--build-arg': 'Set build-time variable', '--platform': 'Set target platform' } },
      run: { description: 'Create and start a new container', flags: { '-d': 'Run in detached mode', '-p': 'Map port (host:container)', '-v': 'Mount a volume', '--name': 'Assign a container name', '-e': 'Set environment variable', '--rm': 'Remove container on exit', '-it': 'Interactive with pseudo-TTY', '--network': 'Connect to a network' } },
      push: { description: 'Upload an image to a registry', flags: { '--all-tags': 'Push all tags' } },
      pull: { description: 'Download an image from a registry', flags: { '--platform': 'Pull for specific platform' } },
      ps: { description: 'List running containers', flags: { '-a': 'Show all containers', '-q': 'Only show container IDs', '--filter': 'Filter by condition' } },
      stop: { description: 'Stop running containers', flags: { '-t': 'Timeout before killing' } },
      rm: { description: 'Remove stopped containers', flags: { '-f': 'Force remove running container', '-v': 'Remove associated volumes' } },
      exec: { description: 'Run a command in a running container', flags: { '-it': 'Interactive with pseudo-TTY', '-d': 'Run in background', '-e': 'Set environment variable', '-w': 'Set working directory' } },
      images: { description: 'List locally stored images', flags: { '-q': 'Only show image IDs', '--filter': 'Filter by condition' } },
      logs: { description: 'View container logs', flags: { '-f': 'Follow log output', '--tail': 'Show last N lines', '--since': 'Show logs since timestamp' } },
      compose: { description: 'Manage multi-container applications', flags: { 'up': 'Create and start services', 'down': 'Stop and remove services', 'build': 'Build service images', 'logs': 'View service logs', 'ps': 'List service containers', '-d': 'Detached mode', '-f': 'Specify compose file' } },
    },
    flags: { '--version': 'Show Docker version', '--help': 'Show help' },
  },

  // ========== PYTHON / PIP ==========
  python: {
    description: 'Python programming language interpreter',
    subcommands: {
      '-m': { description: 'Run a module as a script', flags: { 'venv': 'Create virtual environment', 'pip': 'Run pip as module', 'pytest': 'Run pytest', 'http.server': 'Start HTTP server' } },
    },
    flags: { '-c': 'Execute a command string', '-i': 'Interactive mode after script', '-u': 'Unbuffered output', '-V': 'Show Python version', '--version': 'Show Python version', '-3': 'Use Python 3' },
  },
  python3: {
    description: 'Python 3 interpreter',
    subcommands: { '-m': { description: 'Run a module as a script', flags: {} } },
    flags: { '-c': 'Execute a command string', '-V': 'Show Python version' },
  },
  pip: {
    description: 'Python package installer',
    subcommands: {
      install: { description: 'Install packages', flags: { '-r': 'Install from requirements file', '-e': 'Install in editable/development mode', '--upgrade': 'Upgrade to latest version', '-U': 'Upgrade to latest version (short)', '--user': 'Install to user directory' } },
      uninstall: { description: 'Uninstall packages', flags: { '-y': 'Skip confirmation' } },
      freeze: { description: 'Output installed packages in requirements format', flags: {} },
      list: { description: 'List installed packages', flags: { '--outdated': 'Show outdated packages', '--format': 'Output format (columns, json)' } },
      show: { description: 'Show package details', flags: {} },
    },
    flags: { '--version': 'Show pip version', '-V': 'Show pip version' },
  },

  // ========== BREW ==========
  brew: {
    description: 'macOS package manager (Homebrew)',
    subcommands: {
      install: { description: 'Install a formula or cask', flags: { '--cask': 'Install a macOS application', '--force': 'Force install', '--HEAD': 'Install HEAD version' } },
      uninstall: { description: 'Uninstall a formula or cask', flags: { '--force': 'Force removal', '--cask': 'Uninstall a cask' } },
      update: { description: 'Fetch the newest Homebrew and formulae', flags: {} },
      upgrade: { description: 'Upgrade outdated packages', flags: { '--greedy': 'Also upgrade casks with auto-updates' } },
      search: { description: 'Search for formulae and casks', flags: { '--cask': 'Search casks only' } },
      list: { description: 'List installed formulae', flags: { '--cask': 'List installed casks', '--versions': 'Show version numbers' } },
      info: { description: 'Show information about a formula', flags: { '--json': 'Output as JSON' } },
      doctor: { description: 'Check system for potential problems', flags: {} },
      cleanup: { description: 'Remove old versions and cache', flags: { '-s': 'Scrub the cache', '-n': 'Show what would be removed' } },
      services: { description: 'Manage background services', flags: { 'start': 'Start a service', 'stop': 'Stop a service', 'restart': 'Restart a service', 'list': 'List all services' } },
    },
    flags: { '--version': 'Show Homebrew version' },
  },

  // ========== SYSTEM COMMANDS ==========
  ls: { description: 'List directory contents', flags: { '-l': 'Long listing format', '-a': 'Show hidden files', '-h': 'Human-readable sizes', '-R': 'Recursive listing', '-t': 'Sort by modification time', '-S': 'Sort by file size', '-r': 'Reverse sort order', '-1': 'One entry per line', '--color': 'Colorize output' } },
  cd: { description: 'Change the current working directory', flags: { '-': 'Go to previous directory', '~': 'Go to home directory', '..': 'Go up one level' } },
  cp: { description: 'Copy files and directories', flags: { '-r': 'Copy directories recursively', '-R': 'Copy directories recursively', '-i': 'Prompt before overwrite', '-v': 'Verbose output', '-n': 'Do not overwrite existing', '-p': 'Preserve timestamps and permissions' } },
  mv: { description: 'Move or rename files', flags: { '-i': 'Prompt before overwrite', '-v': 'Verbose output', '-n': 'Do not overwrite existing', '-f': 'Force move without prompting' } },
  rm: { description: 'Remove files or directories', flags: { '-r': 'Remove directories recursively', '-f': 'Force removal without prompting', '-i': 'Prompt before each removal', '-v': 'Verbose output', '-rf': 'Force recursive removal' } },
  mkdir: { description: 'Create directories', flags: { '-p': 'Create parent directories as needed', '-v': 'Verbose output', '-m': 'Set file mode (permissions)' } },
  chmod: { description: 'Change file permissions', flags: { '-R': 'Change permissions recursively', '-v': 'Verbose output', '+x': 'Add execute permission', '777': 'Full permissions for all', '755': 'Owner read/write/exec, others read/exec' } },
  chown: { description: 'Change file ownership', flags: { '-R': 'Change ownership recursively', '-v': 'Verbose output' } },
  cat: { description: 'Concatenate and display file contents', flags: { '-n': 'Number all output lines', '-b': 'Number non-blank lines', '-s': 'Squeeze blank lines' } },
  grep: { description: 'Search text using patterns', flags: { '-i': 'Case-insensitive search', '-r': 'Search recursively', '-n': 'Show line numbers', '-l': 'Show only filenames', '-v': 'Invert match', '-c': 'Count matches', '-E': 'Extended regex', '-w': 'Match whole words', '--include': 'Search only matching files', '--color': 'Highlight matches' } },
  find: { description: 'Search for files in a directory hierarchy', flags: { '-name': 'Search by filename pattern', '-type': 'Filter by type (f=file, d=directory)', '-size': 'Filter by size', '-mtime': 'Filter by modification time', '-exec': 'Execute command on results', '-delete': 'Delete matching files', '-maxdepth': 'Limit directory depth' } },
  sed: { description: 'Stream editor for text transformation', flags: { '-i': 'Edit files in place', '-e': 'Add editing command', '-n': 'Suppress automatic printing', 's/': 'Substitution command' } },
  awk: { description: 'Pattern scanning and text processing language', flags: { '-F': 'Set field separator', '-v': 'Set variable', 'NR': 'Current record number', 'NF': 'Number of fields' } },
  curl: { description: 'Transfer data from or to a server', flags: { '-X': 'Specify HTTP method', '-H': 'Add header', '-d': 'Send POST data', '-o': 'Write output to file', '-O': 'Save with remote filename', '-L': 'Follow redirects', '-s': 'Silent mode', '-v': 'Verbose output', '-k': 'Allow insecure connections', '-u': 'User:password authentication', '--json': 'Send JSON data', '-I': 'Show headers only' } },
  wget: { description: 'Download files from the web', flags: { '-O': 'Save as filename', '-q': 'Quiet mode', '-r': 'Recursive download', '-c': 'Continue interrupted download', '--no-check-certificate': 'Skip SSL verification' } },
  ssh: { description: 'Secure shell remote login', flags: { '-p': 'Specify port', '-i': 'Identity file (private key)', '-L': 'Local port forwarding', '-R': 'Remote port forwarding', '-N': 'No remote command', '-f': 'Run in background', '-v': 'Verbose mode', '-o': 'Set SSH option' } },
  scp: { description: 'Secure copy between hosts', flags: { '-r': 'Copy directories recursively', '-P': 'Specify port', '-i': 'Identity file', '-C': 'Enable compression' } },
  tar: { description: 'Archive and compress files', flags: { '-c': 'Create archive', '-x': 'Extract archive', '-f': 'Specify archive file', '-z': 'Compress with gzip', '-j': 'Compress with bzip2', '-v': 'Verbose output', '-t': 'List archive contents', '-C': 'Extract to directory', '--exclude': 'Exclude files matching pattern' } },
  zip: { description: 'Package and compress files', flags: { '-r': 'Recurse into directories', '-e': 'Encrypt with password', '-9': 'Maximum compression' } },
  unzip: { description: 'Extract compressed zip files', flags: { '-d': 'Extract to directory', '-l': 'List archive contents', '-o': 'Overwrite without prompting' } },
  kill: { description: 'Terminate a process by PID', flags: { '-9': 'Force kill (SIGKILL)', '-15': 'Graceful termination (SIGTERM)', '-l': 'List signal names' } },
  ps: { description: 'List running processes', flags: { 'aux': 'Show all processes with details', '-e': 'Show all processes', '-f': 'Full format listing', '-A': 'Show all processes' } },
  top: { description: 'Display real-time system resource usage', flags: { '-o': 'Sort by field (cpu, mem)', '-n': 'Number of iterations' } },
  df: { description: 'Display disk space usage', flags: { '-h': 'Human-readable sizes', '-T': 'Show filesystem type' } },
  du: { description: 'Estimate file and directory space usage', flags: { '-h': 'Human-readable sizes', '-s': 'Summary (total only)', '-d': 'Max directory depth', '--max-depth': 'Max directory depth' } },
  echo: { description: 'Display a line of text', flags: { '-n': 'No trailing newline', '-e': 'Enable escape sequences' } },
  touch: { description: 'Create empty files or update timestamps', flags: { '-a': 'Change access time only', '-m': 'Change modification time only' } },
  head: { description: 'Output the first part of files', flags: { '-n': 'Number of lines to show' } },
  tail: { description: 'Output the last part of files', flags: { '-n': 'Number of lines to show', '-f': 'Follow file as it grows', '-F': 'Follow and retry if file is recreated' } },
  wc: { description: 'Word, line, character, and byte count', flags: { '-l': 'Count lines only', '-w': 'Count words only', '-c': 'Count bytes only', '-m': 'Count characters' } },
  sort: { description: 'Sort lines of text files', flags: { '-r': 'Reverse sort order', '-n': 'Numeric sort', '-u': 'Remove duplicates', '-k': 'Sort by specific field', '-t': 'Set field delimiter' } },
  uniq: { description: 'Report or omit repeated lines', flags: { '-c': 'Prefix lines with count', '-d': 'Only show duplicated lines', '-i': 'Case-insensitive comparison' } },
  xargs: { description: 'Build and execute commands from stdin', flags: { '-I': 'Replace string placeholder', '-P': 'Max parallel processes', '-n': 'Max arguments per command', '-0': 'Null-delimited input' } },
  tee: { description: 'Read from stdin and write to stdout and files', flags: { '-a': 'Append to files instead of overwriting' } },
  which: { description: 'Locate a command in the PATH', flags: { '-a': 'Show all matching executables' } },
  whoami: { description: 'Print the current username', flags: {} },
  date: { description: 'Display or set the system date and time', flags: { '+%Y-%m-%d': 'Format: year-month-day', '-u': 'Display UTC time' } },
  env: { description: 'Display or set environment variables', flags: {} },
  export: { description: 'Set environment variables for child processes', flags: { '-n': 'Remove the export property', '-p': 'List all exported variables' } },
  alias: { description: 'Create a shortcut for a command', flags: {} },
  history: { description: 'Display command history', flags: { '-c': 'Clear history' } },
  clear: { description: 'Clear the terminal screen', flags: {} },
  exit: { description: 'Exit the shell', flags: {} },
  sudo: { description: 'Execute a command as superuser', flags: { '-u': 'Run as specified user', '-s': 'Run a shell as root', '-i': 'Login shell as root', '-k': 'Invalidate cached credentials' } },
  man: { description: 'Display the manual page for a command', flags: { '-k': 'Search man pages by keyword' } },
  less: { description: 'View file contents with pagination', flags: { '-N': 'Show line numbers', '-S': 'Chop long lines', '+F': 'Follow mode (like tail -f)' } },
  more: { description: 'View file contents page by page', flags: {} },
  ln: { description: 'Create links between files', flags: { '-s': 'Create a symbolic link', '-f': 'Force, remove existing target' } },
  pwd: { description: 'Print the current working directory', flags: {} },
  tree: { description: 'Display directory structure as a tree', flags: { '-L': 'Max directory depth', '-a': 'Show hidden files', '-d': 'Directories only', '-I': 'Exclude pattern', '--gitignore': 'Respect .gitignore' } },
  htop: { description: 'Interactive process viewer', flags: {} },
  make: { description: 'Build automation tool', flags: { '-j': 'Number of parallel jobs', '-f': 'Specify Makefile', '-C': 'Change directory first', '-n': 'Dry run (print commands)' } },
  cmake: { description: 'Cross-platform build system generator', flags: { '-B': 'Specify build directory', '-S': 'Specify source directory', '--build': 'Build the project', '-G': 'Specify generator' } },
  rsync: { description: 'Fast, versatile file copying tool', flags: { '-a': 'Archive mode', '-v': 'Verbose output', '-z': 'Compress during transfer', '--delete': 'Delete files not in source', '-n': 'Dry run', '--progress': 'Show transfer progress', '-e': 'Specify remote shell' } },
};

export default commandDB;
