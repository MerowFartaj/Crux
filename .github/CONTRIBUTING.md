# Contributing to CRUX Terminal

Thanks for your interest in contributing to CRUX! Whether it's a bug fix, new feature, or documentation improvement, we appreciate your help.

## Getting Started

1. **Fork the repository** and clone your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/Crux.git
   cd Crux/app
   npm install
   ```

2. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and test them locally with `npm run dev`.

## Code Style

- Write all new code in **TypeScript** (strict mode).
- Follow the existing project conventions — run ESLint and Prettier before committing:

  ```bash
  npm run lint
  npm run format
  ```

- Keep components small and focused. Prefer composition over inheritance.
- Use meaningful variable and function names. Avoid abbreviations.

## Commit Messages

Write clear, concise commit messages that describe **what** changed and **why**:

- `fix: resolve crash when closing split pane with active process`
- `feat: add CSV column sorting in file preview panel`
- `docs: update SSH manager configuration examples`

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/) but don't enforce it strictly.

## Opening a Pull Request

1. Push your branch to your fork.
2. Open a PR against `main` on the upstream repo.
3. Fill out the PR template with:
   - A clear description of what your PR does
   - Screenshots or recordings for UI changes
   - Steps to test your changes
4. Link any related issues (e.g., "Closes #42").

## Code Review

- A maintainer will review your PR, usually within a few days.
- Be open to feedback — we may suggest changes or ask questions.
- Once approved, a maintainer will merge your PR.

## Reporting Bugs

Use the [bug report template](ISSUE_TEMPLATE/bug_report.md) when filing issues. Include your macOS version, CRUX version, and steps to reproduce.

## Community Guidelines

- Be respectful and constructive in all discussions.
- Assume good intent. We're all here to make CRUX better.
- If you're unsure about a change, open an issue first to discuss it.

---

Thank you for helping make CRUX better!
