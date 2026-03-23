#!/bin/bash
# ============================================================
# ERP 文件一致性稽核腳本
#
# 用途：自動偵測 memory/ 下的文件是否已正確索引至
#       CLAUDE.md 快速索引 與 SKILL.md 參考資源
#
# 執行方式（從 workspace 根目錄）：
#   bash .claude/skills/erp-spec/scripts/audit-erp-docs.sh
#
# 退出碼：
#   0 = 無問題
#   1 = 有缺漏索引（需補充）
# ============================================================

# --- 找到 workspace 根目錄（git 根目錄）---
ROOT=$(git -C "$(cd "$(dirname "$0")" && pwd)" rev-parse --show-toplevel 2>/dev/null)
if [ -z "$ROOT" ]; then
    # fallback：腳本位於 .claude/skills/erp-spec/scripts/，往上四層
    ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
fi

CLAUDE_MD="$ROOT/CLAUDE.md"
SKILL_MD="$ROOT/.claude/skills/erp-spec/SKILL.md"
ERP_DIR="$ROOT/memory/erp"
SHARED_DIR="$ROOT/memory/shared"

ISSUES=0
WARNINGS=0

echo "======================================"
echo "  ERP 文件一致性稽核"
echo "  $(date '+%Y-%m-%d %H:%M')"
echo "  Root: $ROOT"
echo "======================================"
echo ""

# ─────────────────────────────────────────
# Check 1：memory/erp/*.md → CLAUDE.md 快速索引
# ─────────────────────────────────────────
echo "【Check 1】memory/erp/ 檔案 → CLAUDE.md 快速索引 ERP 資源"
echo "------------------------------------------------------------"
if [ ! -d "$ERP_DIR" ]; then
    echo "  ❌ 找不到目錄：memory/erp/"
    ISSUES=$((ISSUES + 1))
else
    for f in "$ERP_DIR"/*.md; do
        [ -f "$f" ] || continue
        fname=$(basename "$f")
        if ! grep -q "$fname" "$CLAUDE_MD" 2>/dev/null; then
            echo "  ⚠️  未索引：$fname 未出現在 CLAUDE.md"
            ISSUES=$((ISSUES + 1))
        else
            echo "  ✅  $fname"
        fi
    done
fi
echo ""

# ─────────────────────────────────────────
# Check 2：memory/shared/*.md → CLAUDE.md 共用資源
# ─────────────────────────────────────────
echo "【Check 2】memory/shared/ 檔案 → CLAUDE.md 共用資源"
echo "------------------------------------------------------------"
if [ ! -d "$SHARED_DIR" ]; then
    echo "  ❌ 找不到目錄：memory/shared/"
    ISSUES=$((ISSUES + 1))
else
    for f in "$SHARED_DIR"/*.md; do
        [ -f "$f" ] || continue
        fname=$(basename "$f")
        if ! grep -q "$fname" "$CLAUDE_MD" 2>/dev/null; then
            echo "  ⚠️  未索引：$fname 未出現在 CLAUDE.md"
            ISSUES=$((ISSUES + 1))
        else
            echo "  ✅  $fname"
        fi
    done
fi
echo ""

# ─────────────────────────────────────────
# Check 3：關鍵 ERP 資源 → SKILL.md 參考資源
# ─────────────────────────────────────────
echo "【Check 3】關鍵 ERP 資源 → SKILL.md 參考資源"
echo "------------------------------------------------------------"
KEY_FILES=(
    "state-machines.md"
    "state-machines-ops.md"
    "product-goals.md"
    "user-scenarios.md"
    "glossary.md"
    "business-process.md"
    "principles.md"
)
# 注意：open-questions.md 與 scenarios.md 已遷移至 Notion，不再檢查本地檔案
for kf in "${KEY_FILES[@]}"; do
    if ! grep -q "$kf" "$SKILL_MD" 2>/dev/null; then
        echo "  ⚠️  未索引：$kf 未出現在 SKILL.md"
        ISSUES=$((ISSUES + 1))
    else
        echo "  ✅  $kf"
    fi
done
echo ""

# ─────────────────────────────────────────
# Check 4：memory/erp/*.md → SKILL.md 中是否有任何提及
#          （提示性，非強制錯誤，僅標記 ℹ️）
#          例外排除：封存檔（*-archive.md）與已標記為舊版的檔案
# ─────────────────────────────────────────
echo "【Check 4】memory/erp/*.md → SKILL.md 中有提及？（提示）"
echo "------------------------------------------------------------"

# 已知合理不在 SKILL.md 中的例外清單（用空格分隔）
SKIP_IN_SKILL="open-questions-archive.md test-cases.md"

for f in "$ERP_DIR"/*.md; do
    [ -f "$f" ] || continue
    fname=$(basename "$f")
    # 封存檔（*-archive.md）跳過
    [[ "$fname" == *-archive.md ]] && continue
    # 已知例外跳過
    echo "$SKIP_IN_SKILL" | grep -qw "$fname" && continue
    if ! grep -q "$fname" "$SKILL_MD" 2>/dev/null; then
        echo "  ℹ️  $fname 未出現在 SKILL.md（確認是否需加入參考資源）"
        WARNINGS=$((WARNINGS + 1))
    fi
done
if [ $WARNINGS -eq 0 ]; then
    echo "  ✅ 所有 memory/erp/ 檔案都已在 SKILL.md 中提及"
fi
echo ""

# ─────────────────────────────────────────
# Check 5：.claude/skills/erp-spec/SKILL.md 是否在 CLAUDE.md 中有索引
# ─────────────────────────────────────────
echo "【Check 5】SKILL.md → CLAUDE.md 工具索引"
echo "------------------------------------------------------------"
if ! grep -q "SKILL.md" "$CLAUDE_MD" 2>/dev/null; then
    echo "  ⚠️  SKILL.md 未出現在 CLAUDE.md 工具索引"
    ISSUES=$((ISSUES + 1))
else
    echo "  ✅  SKILL.md 已在 CLAUDE.md 中索引"
fi
echo ""

# ─────────────────────────────────────────
# 總結
# ─────────────────────────────────────────
echo "======================================"
echo "  稽核結果："
if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "  ✅ 全部通過，無問題"
elif [ $ISSUES -eq 0 ]; then
    echo "  ℹ️  通過（有 $WARNINGS 條提示，可選擇補充）"
else
    echo "  ⚠️  發現 $ISSUES 個缺漏索引需修正"
    [ $WARNINGS -gt 0 ] && echo "  ℹ️  另有 $WARNINGS 條提示"
fi
echo "======================================"

exit $ISSUES
