---
title: Architecture
description: AIO の現在の構成（Human / Claude Code / ChatGPT / GitHub / VM / Scheduler / Review）と、そこへ至った変更履歴。
---

## 現在の構成（2026-07-11 時点）

```mermaid
flowchart TB
  subgraph Humanの領域
    H[Human プロジェクトオーナー<br>最終決定・事後レビュー・停止権限]
  end

  subgraph GitHub［SSOT・3リポジトリ+公開用］
    OS[ai-improvement-os 非公開<br>ガバナンス・Decision・改善記録]
    BIZ[business-portfolio 非公開<br>事業ケース検証]
    INBOX[external-ai-inbox 非公開<br>外部AI出力の受け渡し箱]
    PUB[aio-public 公開用<br>本サイト]
  end

  subgraph 実行系
    MAIN[Claude Code メインセッション<br>コーディネータ・実装・merge代行]
    SUB[subagents ×4<br>記録/事業/インフラ/レビュー]
    CRON[クラウド定期ルーチン<br>日次監査・取り込み・準備]
    VM[Ubuntu VM t3.small 2GB<br>認証情報が要る処理と定時実行]
  end

  GPT[ChatGPT<br>ディープリサーチ・独立レビュー]

  H -- 指示・承認・停止 --> MAIN
  MAIN -- 委任 --> SUB
  MAIN & SUB & CRON -- PR --> OS & BIZ & PUB
  OS & BIZ -- 状態の再発見 --> CRON
  VM -- 定時ジョブ・書き戻し --> BIZ
  H -- リサーチ依頼を仲介 --> GPT
  GPT -- 成果ファイル --> INBOX
  INBOX -- 定期取り込み --> MAIN & CRON
```

※ Mermaid ソースで併記しています（図の描画は今後対応）。

## 各要素の責務

- **Human**: すべての権限の源泉。Decision 採択・外部公開・課金/契約の実行・停止スイッチ。AI が Human の停止意思を上書きすることはできない設計
- **Claude Code メインセッション**: Human との単一チャネル窓口。タスクを分類し、コンテキストを分離した subagent やバックグラウンドタスクへ委任。PR 作成前に 8 項目のセルフレビュー（Review Agent）を実行し、権限層の条件を満たす PR のみ merge を代行
- **subagents（4種）**: 記録系 / 事業運用系 / インフラ系 / レビュー系（read-only）。コンテキスト分離により、無関係な文脈の混入（ハルシネーションの温床）とトークン消費を抑える
- **クラウド定期ルーチン**: cron 式で起動する使い捨てセッション。**前回の記憶を持たない前提で、毎回 GitHub から状態を再発見して働く**。日次リポジトリ監査・外部 AI 出力の取り込み（6時間毎）・コンテンツ準備（日次/週次/月次）が稼働中
- **Ubuntu VM**: 常時稼働。認証情報はこの VM のローカルにだけ置き、クラウドセッションには渡さない（認証情報の局所性）。外部サービスへの定時自動実行はここで行う
- **ChatGPT**: 大規模リサーチと独立レビューの外部依頼先。共有リポジトリを直接触らせず、**専用インボックスリポジトリ経由の疎結合連携**（成果はファイルとして受け取り、Claude が検証してから正式リポジトリへ反映）
- **権限 3 層モデル**: Layer 1（事前承認済み・AI が自走可）/ Layer 2（外部公開など・Human の明示許可が要る）/ Layer 3（認証情報・課金・法倫理など・Human が許可しても AI は実行しない）

## 変更履歴（過去の構成から現在まで）

| 時期 | 変更 | 理由 |
|---|---|---|
| 2026-06-28 | GitHub SSOT・Human 最終決定・権限層モデルで開始 | 監査可能性と停止可能性を最初に確保 |
| 7月上旬 | **Claude 実装 × ChatGPT merge 承認の 2 エージェント体制を廃止**し、Claude 単一エージェント＋Human 事後レビューへ | 2 つの AI 間の認識不一致と往復コストが利益を上回った（[Lessons 01](../lessons/01-two-agent-retirement/)） |
| 7月上旬 | **タスクキュー自動化を停止**（停止ファイルを常置） | 自動化を急ぎすぎ、検証より先に配管を作ってしまった（[Lessons 02](../lessons/02-automation-too-fast/)） |
| 7月上旬 | 共有インデックスファイルの**並列変更を禁止し直列化** | 定期ルーチンとメイン作業の PR 競合が実際に発生（[Lessons 03](../lessons/03-shared-index-conflicts/)） |
| 7月中旬 | 外部実行をクラウドから **VM cron へ移設** | クラウドセッションから認証情報に届かないことが実証されたため。結果的に「認証情報の局所性」という良い分離になった |
| 7月中旬 | subagents 4 種と権限ガード hook を導入 | コンテキスト分離と、権限境界の機械的強制 |

## コスト構成（実額の考え方）

- AWS EC2 t3.small 1台（従量・最小構成）
- Claude Pro サブスクリプション（利用枠内で運用・モデルを用途別に階層化）
- ChatGPT 有料プラン（Human が別途利用）
- 外部サービス API の従量課金（**月次上限ガードをコード側に実装**。上限到達で実行前に自動停止）

方針として、実測データなしの先行投資はせず、収益・効果の実測に連動して段階的に拡張します（詳細な資金計画は非公開）。
