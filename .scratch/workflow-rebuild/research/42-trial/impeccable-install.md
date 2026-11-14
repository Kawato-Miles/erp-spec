# Impeccable 安裝與偵測程式查證

來源根目錄（下稱「來源」）：`/tmp/workflow-rebuild-ticket42-src-20261113/src/`。本機沒有 Impeccable 的 README 與安裝說明，只有技能本體（`imp/skill/`）與檔案清單。安裝指令的原文因此取自網路，標為「網路來源」。

引用標記：行首 `>` 的句子是原文。標「本機」的句子已用 `grep -F` 比對來源檔。標「網路」的句子來自 WebFetch，該工具回傳的是小模型整理過的文字，不保證逐字，不可 `grep` 比對。

網路來源網址：`https://raw.githubusercontent.com/pbakaus/impeccable/main/README.md`（讀取日 2026-11-14，只讀文字）。

## 1. 官方安裝指令有哪幾種

結論：README 列出五種。適用 Claude Code 的是 `npx impeccable install`（主要）與外掛市集（次要）。

| 方式 | 指令 | 適用 Claude Code |
|------|------|------------------|
| npx 安裝（主要） | `npx impeccable install` | 是 |
| 外掛市集 | `/plugin marketplace add pbakaus/impeccable` | 是 |
| Git 子模組 | `git submodule add https://github.com/pbakaus/impeccable vendor/impeccable` | 只裝技能，不含 hook |
| 手動複製 | `cp -r .claude/skills/impeccable your-project/.claude/skills/` | 是，但不含 hook 與子代理 |
| Copilot、Grok 外掛 | 與 Claude Code 無關 | 否 |

網路來源（未能逐字比對）：
> `npx impeccable install`
> From your project root:
> `/plugin marketplace add pbakaus/impeccable`, then open `/plugin` and install Impeccable.
> mkdir -p your-project/.claude/skills && cp -r .claude/skills/impeccable your-project/.claude/skills/
> A manual copy skips the design hook and subagents.

本機佐證（技能本體也把 `npx impeccable install` 當成安裝指令）：
- `imp/skill/reference/hooks.md:55`
> tell the user to run `npx impeccable install` and then `hermes plugins enable impeccable-design-hook` instead.
- `imp/skill/scripts/engine-checksums.txt:2`
> The launchers, the npm shim, `impeccable install` and scripts/fetch-engine.mjs verify
- `imp/skill/reference/doctor.md:9`
> `npx impeccable update` fixes it, or the harness's plugin manager for a plugin install.
- `imp/skill/SKILL.src.md:8`
>   - Bash(npx impeccable *)

筆記裡的 `npx impeccable install` 與原文一致。

## 2. 可否只裝進專案資料夾

結論：可以。安裝時選專案層或全域，或用旗標指定。旗標只有網路來源。

網路來源（未能逐字比對）：
> From your project root:
> The installer detects your coding tools, asks whether to install for this project or globally
> For scripts, pass `--providers=claude,codex,cursor` and `--scope=project|global`.

可寫成：`npx impeccable install --providers=claude --scope=project`。這行是依上述原文組合的，README 沒有逐字寫出，未實測。

本機佐證（專案層與使用者層是兩種安裝）：
- `imp/skill/reference/hooks.md:17`
> Claude Code (`.claude/settings.local.json` for a project-scope install; `$CLAUDE_CONFIG_DIR/settings.json` for a user-scope install, defaulting to `~/.claude/settings.json`;

## 3. 安裝時寫入的路徑與檔案，會不會改既有檔

結論：專案層會寫技能資料夾與 `.claude/settings.local.json` 的 hook。hook 設定是「合併」進既有設定，不是整檔覆蓋。是否寫入 `AGENTS.md` 未查到。

寫入路徑（本機）：
- `imp/skill/reference/hooks.md:115`
> Project installs use `.claude/settings.local.json`, `.codex/hooks.json`, `.cursor/hooks.json`, `.github/hooks/impeccable.json`, and `.gemini/settings.json`; a user-scope Claude install uses the active account's `$CLAUDE_CONFIG_DIR/settings.json` (default `~/.claude/settings.json`).
- `imp/skill/reference/hooks.md:27`
> Automatic repair preserves unrelated settings and hooks and leaves malformed manifests alone.
- `imp/skill/reference/hooks.md:21`
> merged into the settings already there
- `imp/skill/reference/hooks.md:11`
> Per-developer overrides, including the install consent decision (`hook.consent`) the CLI records, live in the gitignored `.impeccable/config.local.json`.

技能資料夾位置（網路來源，未能逐字比對）：
> Copy `skills/impeccable` from the folder below into the same place in your project, or into the global folder.

專案內的工作檔（本機）：
- `imp/skill/reference/init.md:124`
> Tell the user once which files to commit: PRODUCT.md, DESIGN.md, `.impeccable/config.json`, `.impeccable/surfaces/`, `.impeccable/design.json`, `.impeccable/live/config.json`, and `.impeccable/critique/ignore.md`.
- `imp/skill/reference/init.md:3`
> It does not invent a visual world and does not write DESIGN.md;
- `imp/skill/reference/critique.md:230`
> write it to `.impeccable/critique/` so the user can refer back

以上檔案由後續指令（`init`、`critique` 等）寫入，不是安裝當下寫入。

會不會改既有檔：
- hook 設定：合併進既有檔，不動無關設定（`hooks.md:21`、`hooks.md:27`）。
- 技能資料夾：網路來源說連結時，既有技能資料夾除非加 `--force` 否則不動（網路，未能逐字比對）。
> Existing skill folders stay put unless you pass `--force`.

`AGENTS.md`：未查到。搜過 `imp/skill/` 全部檔案，關鍵字 `AGENTS`、`CLAUDE.md`，沒有命中安裝寫入的說明。技能資料夾含 `agents/` 子目錄（四個子代理定義檔），那是子代理，不是 `AGENTS.md`。

## 4. 偵測程式（引擎）是安裝時下載還是首次執行才下載

結論：本機來源顯示是第一次執行啟動腳本時才下載（最後手段）。啟動腳本先找現成的引擎，找不到才下載。網路來源另說 `npx impeccable install` 也會驗證引擎下載，安裝當下是否預先下載，來源未寫明。

找引擎的順序（`imp/skill/scripts/impeccable`）：
- 第 2 至 5 行
> # Impeccable launcher. Runs the platform binary shipped next to this script:
> # Order: $IMPECCABLE_BIN, the sibling binary, ~/.impeccable/bin/impeccable,
> # the version-pinned cache, then `impeccable` on PATH. Never needs Node.

下載時機與網址：
- 第 182 至 184 行
> # Last resort: fetch this version's binary for the current platform from the
> # public release channel into the user cache. Needs network; sandboxes without
> # egress preinstall the binary on PATH instead.
- 第 231 至 232 行
>   base="${IMPECCABLE_DOWNLOAD_BASE:-https://github.com/pbakaus/impeccable/releases/download}"
>   url="$base/engine-v$version/$asset"
- 第 160 行
> asset="impeccable-$os-$arch"

存放路徑：
- 第 158 至 159 行
> cache_root="${IMPECCABLE_HOME:-${HOME:-/nonexistent}/.impeccable}"
> cached="$cache_root/bin/$version/impeccable$exe"
- 第 318 行
> Download impeccable-$os-$arch from https://github.com/pbakaus/impeccable/releases (tag engine-v$version) into $cache_root/bin/$version/impeccable$exe (then chmod +x), or set IMPECCABLE_BIN to a preinstalled engine binary.

有核對檢查碼，核對失敗就拒絕執行：
- 第 14 至 15 行
> # the download are verified against engine-checksums.txt (next to this
> # script), never against anything published beside the binary;
- 第 235 至 238 行
>   if [ -z "$expected" ] && [ -z "$expected_x64" ]; then
>     echo "impeccable: no checksum for engine $version ($asset) in $manifest; refusing the unverified download" >&2
- 第 277 至 281 行
>     if [ "$actual" != "$expected" ]; then
>       echo "impeccable: checksum mismatch downloading $url" >&2
- 第 274 行
> refusing the unverified download" >&2
- `imp/skill/scripts/engine-checksums.txt:5`（目前版本與 macOS 對應項，雜湊為 SHA-256）
> 0.1.23 impeccable-darwin-arm64 b10fccb5746fab4c6c5c0867a0ea51182ea0c8dbdfb292ac3d159adcbb2fa868
> 0.1.23 impeccable-darwin-x64 9a025767a15e59312bcb5053c2b0533adbe3ff711c6c23ef0688d18924f98ec8
- `imp/skill/scripts/VERSION:1`
> 0.1.23

其他行為：
- 第 112 至 113 行：設環境變數 `IMPECCABLE_BIN` 時直接執行該檔，不做探測。
> if [ -n "${IMPECCABLE_BIN:-}" ] && [ -x "${IMPECCABLE_BIN}" ]; then
- 第 28 行：用 `engine-probe` 確認候選檔是引擎。
> probe_out=$(IMPECCABLE_LAUNCHER_PROBE=1 "$1" engine-probe 2>/dev/null) || return 1
- 下載用 `curl`（第 195 行），沒有 `curl` 才用 `wget`（第 209 行）。
> metadata=$(curl -fsSL --retry 2 -w '%{http_code} %{url_effective}' -o "$tmp" "$1" 2>/dev/null) || fetch_result=$?
> wget -q -O "$tmp" "$1" 2>/dev/null

網路來源（未能逐字比對）：
> The skill itself runs a self-contained engine binary that ships next to it or downloads once into `~/.impeccable/bin/`.

注意：網路來源寫 `~/.impeccable/bin/`，啟動腳本實際下載到 `~/.impeccable/bin/<版本>/impeccable`（版本子資料夾）。以腳本為準。

## 5. 偵測程式怎麼跑、吃什麼輸入

結論：原始碼檔、渲染頁面兩者都可。

指令格式（本機）：
- `imp/skill/reference/critique.md:76`
> {{scripts_path}}/impeccable detect --json [target]
- `imp/skill/reference/critique.md:79`
> - Pass markup files/directories as `[target]`; do not pass CSS-only files.
- `imp/skill/reference/critique.md:80`
> - For URLs, skip CLI scan and use browser visualization.
- `imp/skill/reference/critique.md:82`
> - Exit code 0 = clean; 2 = findings.
- `imp/skill/reference/audit.md:69`
> `{{scripts_path}}/impeccable detect --cdp 9222 --target <part of the page URL or title> --json`
- `imp/skill/reference/audit.md:69`
> It returns the same JSON as a URL scan

輸出格式：`--json` 輸出 JSON；結束碼 0 表示無發現，2 表示有發現。

渲染頁面有兩條路：
1. 對執行中的桌面應用，用 `detect --cdp <埠> --target <名稱> --json`。這是本機原文。
2. 對網頁，啟動 `live-server`，把 `detect.js` 注入瀏覽器分頁，讀主控台訊息（`critique.md:87` 至 `critique.md:93`）。
> start `{{scripts_path}}/impeccable live-server --background`
> inject `http://localhost:PORT/detect.js`

網路來源（未能逐字比對）：
> `npx impeccable detect src/`
> `npx impeccable detect --json .`
> Source files like JSX and TSX get the pattern rules only.
> scan a rendered page (uses your installed Chrome or Edge)

各指令在哪一步呼叫偵測程式：

| 指令 | 呼叫位置 | 原文 |
|------|----------|------|
| `audit` | 技術品質檢查段，用「內建偵測程式」，未寫出完整指令（`audit.md:67`） | > Run the bundled detector and verify each finding in context. |
| `critique` | 評估 B 的 CLI 掃描（`critique.md:76`） | > {{scripts_path}}/impeccable detect --json [target] |
| `typeset` | 第 2 步「機械掃描」，限字型範圍（`typeset.md:27`） | > {{scripts_path}}/impeccable detect --json --scope type [target files or dirs] |
| `polish` | 不另外呼叫（`polish.md:95`） | > never add another detector pass. |
| `layout` | 同 `typeset`，範圍為版面（`layout.md:28`） | > {{scripts_path}}/impeccable detect --json --scope layout [target files or dirs] |

`audit` 的完整指令格式：未查到（`audit.md` 只寫「執行內建偵測程式」，沒有指令列）。搜過 `audit.md`、`audit.native.md`，關鍵字 `impeccable detect`、`detect --`。

## 6. 需不需要瀏覽器、Node、網路、帳號或金鑰；會不會傳資料到外部

結論：
- Node：執行引擎不需要，只有 `npx` 安裝需要。
- 瀏覽器：掃原始碼不需要；掃渲染頁面需要。
- 網路：首次下載引擎需要。
- 帳號與金鑰：未查到任何要求。
- 外傳資料：未查到引擎外傳的說明；網路來源提到遙測（telemetry）與設計方向目錄的網路取用。

本機：
- `imp/skill/scripts/impeccable:5`
> Never needs Node.
- `imp/skill/SKILL.src.md:22`
> no Node or other runtime is required.
- `imp/skill/scripts/impeccable:186`
> echo "Engine $version setup needs network access and write permission to $cache_root/bin/$version." >&2
- `imp/skill/reference/hooks.md:113`
> it runs the engine unsandboxed with the agent's environment and network access
- `imp/skill/reference/hooks.md:113`
> **never** call it sandboxed.
- `imp/skill/reference/critique.md:87`
> Prefer the harness's native/browser-canvas screenshot path before hand-rolling a Playwright/Puppeteer script

網路來源（未能逐字比對）：
> Node is only needed for `npx`.
> URL scanning "uses your installed Chrome or Edge."
> When a new design starts, the skill fetches a set of visual directions from the impeccable.style catalog.
> Disable telemetry with `npx impeccable telemetry off`, `DO_NOT_TRACK=1`

帳號與金鑰：搜過 `scripts/impeccable`、`reference/*.md`，關鍵字 `account`、`API key`、`token`、`login`，沒有要求。`hooks.md` 的 `account` 指 Claude 設定目錄，不是服務帳號。

遙測送什麼資料：未查到。README 摘要只說可關閉，沒有寫送出的欄位。PM 安裝前須自行決定是否執行 `npx impeccable telemetry off`。

## 7. 安裝後的 hook 與代理行為；怎麼移除

結論：`npx impeccable install` 會裝設計偵測 hook。Claude Code 每次編輯 UI 檔後，hook 自動掃描並把提醒放進代理的上下文。對話結束時另有一次完整掃描。

自動行為（本機）：
- `imp/skill/reference/hooks.md:5`
> The hook runs the impeccable design detector on direct file edits to design-relevant files
> Claude Code, Codex, Cursor, and GitHub Copilot use a post-tool-use hook and push a short system reminder into the agent's context after the edit
- `imp/skill/reference/hooks.md:7`
> deferred to a deep pass on the `Stop` hook event, which runs the full rule set over every UI file touched in the session
- `imp/skill/reference/hooks.md:114`
> The hook never blocks an edit; it emits a post-edit reminder.
- `imp/skill/SKILL.src.md:87`
> **Hooks:** `{{command_prefix}}impeccable hooks <on|off|status|ignore-rule|ignore-file|ignore-value|reset>` manages the design detector hook for this project

沒有 hook 時：
- `imp/skill/reference/hooks.md:9`
> A session with no automatic hook gets one `MANUAL_DETECTOR_REQUIRED` directive from `impeccable context` asking for a single detector run at the end.

`context` 會自動修復 hook（需本機同意）：
- `imp/skill/reference/hooks.md:27`
> When `hook.consent` is `"accepted"` in the project's `config.local.json` and the hook is enabled, `impeccable context` restores missing or stale entries for installed harness skills

移除與關閉：
- 關閉 hook（保留技能）：`impeccable hooks off`（`hooks.md:37`、`hooks.md:54`）。
> | `off` | Set `enabled: false` in `.impeccable/config.json`. |
- 刪設定與移除 hook 項目：`impeccable hooks reset`（`hooks.md:43`）。
> Delete the project config, dedup cache, and Cursor pending queue, and remove the hook's entries from every provider manifest `on` installs
- 單次關閉環境變數：`IMPECCABLE_HOOK_DISABLED=1`（`hooks.md:120`）。
> The legacy `IMPECCABLE_HOOK_DISABLED=1` env var also works as a one-shot override that follows the shell.

解除安裝指令（整個技能）：未查到。README 摘要也說沒有解除安裝說明。搜過 `hooks.md`、`doctor.md`、`SKILL.src.md`、`scripts/impeccable`，關鍵字 `uninstall`、`remove`、`impeccable uninstall`。依安裝位置推得需刪除的項目（推論，非原文）：專案的技能資料夾、`.claude/settings.local.json` 內 hook 項目（`hooks reset` 可移除）、`.impeccable/`、`~/.impeccable/bin/`（引擎快取）。

## 8. 啟動器不可用時的降級流程

結論：技能主檔規定降級流程。啟動器失敗不阻擋規劃與編輯，改為直接讀專案內既有的 `PRODUCT.md` 與 `DESIGN.md`，少了 `impeccable context` 載入的內容（表面簡報、原生平台指引等）。

主檔原文：
- `imp/skill/SKILL.src.md:26`
> **Launcher unavailable:** On refusal or failure, send a separate message **before the next tool call**: “Context loading did not run; I’ll read the existing project context directly.” Then read existing PRODUCT.md and DESIGN.md without inventing missing context, follow applicable steps 2–3, including reading [reference/craft-floor.md](reference/craft-floor.md) immediately before any UI edit, and continue through permitted tools. This applies to planning and editing; launcher failure alone does not block either.
- `imp/skill/SKILL.src.md:22`（正常情況下 `context` 載入的內容）
> It loads PRODUCT.md, DESIGN.md, the matching surface brief, and native-platform guidance when applicable

降級下還能跑的：
- 讀 `PRODUCT.md`、`DESIGN.md`。
- 規劃與編輯（`SKILL.src.md:26`）。
- 讀 `reference/craft-floor.md`。

少了什麼：
- `impeccable context` 的載入結果：對應的表面簡報、原生平台指引、`UPDATE_AVAILABLE`、`CONTEXT_STALE` 等指令。
- 偵測程式：`critique` 對偵測程式缺失另有規則（`critique.md:11` 與 `critique.md:83`）。
> A skipped detector is a failed critique run unless `impeccable detect` is missing or crashes after a real attempt
> If the detector entrypoint is missing or fails to load, report deterministic scan unavailable and continue with browser/manual review.

主檔沒有逐一列出降級下哪些子指令可跑。`audit`、`typeset`、`layout` 在啟動器失敗時的行為：未查到。搜過 `SKILL.src.md`、`audit.md`、`typeset.md`、`layout.md`、`polish.md`，關鍵字 `Launcher unavailable`、`launcher`、`unavailable`、`launcher failure`，只有上列兩處。

## 未查到的項目彙整

| 題號 | 內容 |
|------|------|
| 3 | 是否寫入 `AGENTS.md` |
| 4 | `npx impeccable install` 是否在安裝當下預先下載引擎 |
| 5 | `audit` 的完整偵測指令列 |
| 6 | 帳號與金鑰要求；遙測送出的欄位 |
| 7 | 整個技能的解除安裝指令 |
| 8 | 降級下 `audit`、`typeset`、`layout` 的行為 |
