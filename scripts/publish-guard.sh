#!/usr/bin/env bash
# 公開前ガード: 公開してはいけない情報の代表パターンを機械検査する（補助・目視チェックリストを置換しない）
# 対象: コンテンツと設定（このスクリプト自身と checklists/ は除外）
set -u

TARGETS=(src README.md astro.config.mjs)
FAIL=0

# 禁止パターン（拡張時は D-045 の公開対象外リストと同期する）
PATTERNS=(
  'aios-c03'                      # 内部ホスト名
  'nkatayama'                     # 個人識別子
  '[A-Za-z0-9._%+-]+@gmail\.com'  # 個人メール
  'trig_01'                       # trigger ID
  'ghp_[A-Za-z0-9]'               # GitHub PAT
  'github_pat_'                   # GitHub fine-grained PAT
  'AKIA[0-9A-Z]{16}'              # AWS アクセスキー
  'BEGIN [A-Z ]*PRIVATE KEY'      # 秘密鍵
  'ssh-rsa AAAA'                  # 公開鍵貼付（環境特定回避）
  'x-credentials'                 # 認証情報ファイル名
  '172\.26\.'                     # 内部 IP 帯
  '運転資金'                       # 非公開の資金情報
  '300万'                         # 非公開の資金額
  'joto_odekake'                  # 事業アカウント名（内容非公開方針）
)

for pat in "${PATTERNS[@]}"; do
  hits=$(grep -rInE "$pat" "${TARGETS[@]}" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "NG pattern: $pat"
    echo "$hits"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 1 ]; then
  echo "publish-guard: FAILED（公開禁止パターンを検出）"
  exit 1
fi
echo "publish-guard: OK"
