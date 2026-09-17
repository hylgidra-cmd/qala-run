# Claude Code terminal setup for QalaRun

The recommended setup for this project is **Claude Code inside WSL2**, because Docker, PostGIS, osmium and the repository also run inside WSL2.

## 1. Open WSL and the project

From Windows Terminal:

```powershell
wsl
```

Then inside Ubuntu/WSL:

```bash
cd ~/projects/qalarun
code .
```

If the project is currently under `C:\...`, copy it once into `~/projects/qalarun` before active development.

## 2. Install the standalone Claude Code CLI

Run this inside the WSL terminal:

```bash
curl -fsSL https://claude.ai/install.sh | bash -s stable
```

Close and reopen the terminal if `claude` is not immediately found. Verify:

```bash
claude --version
claude doctor
```

The native installer is preferred. Do not use `sudo npm install -g`.

## 3. Sign in

Inside the project folder run:

```bash
claude
```

Choose the Claude account sign-in option and finish authorization in the browser. A paid Claude plan can use Claude Code without adding an API key. Do not paste an API key into prompts, source files or `.env` unless the account setup specifically requires API billing.

## 4. Connect it to VS Code

Use VS Code’s integrated terminal (`Ctrl+``) and start:

```bash
claude
```

When started in the integrated terminal, it normally detects VS Code. From an external terminal, enter this inside the Claude session:

```text
/ide
```

The VS Code extension is optional for CLI use. To install the graphical panel, open Extensions with `Ctrl+Shift+X`, search for **Claude Code** by Anthropic, and install it.

## 5. First QalaRun session

Start Claude in the repository root:

```bash
cd ~/projects/qalarun
claude
```

Paste only **Prompt 0** from `docs/CLAUDE_PROMPTS.md`. It tells Claude to inspect the project without changing files. After reviewing its answer, paste **Prompt 1**.

Do not give all prompts at once. One prompt must finish and pass its checks before the next begins.

## 6. Continue an earlier Claude session

```bash
claude --resume
```

Choose the QalaRun session from the list. Because this repository contains `CLAUDE.md`, new sessions automatically receive the project rules.

## 7. Safe working mode

- Start with Manual/default permissions.
- Read every requested command before approving it.
- Never approve commands that delete broad folders or expose `.env`.
- Before large changes, check `git status` and create a commit or branch.
- Ask Claude to show tests and exact results at the end of every task.

Official documentation:

- <https://code.claude.com/docs/en/setup>
- <https://code.claude.com/docs/en/vs-code>
