# 政治家データベース Evilpo DB

日本の政治に関する透明性を高めるための政治家データベースです。裏金問題と統一教会問題に関わった議員の詳細情報を整理・可視化しています。

- [ページリンク](src/index.html)

## 概要

このプロジェクトは、日本の政治における重要な問題や不祥事に関わった疑いのある政治家の情報を体系的に整理し、
国民が政治情報にアクセスしやすくすることを目的としています。


## データ内容

### 裏金議員（46名）
- **対象**: 自民党の政治資金パーティー裏金問題に関わった議員
- **データ項目**:
  - 議員名・写真（Wikipedia連携）
  - 選挙区
  - エリア（地理的分類）
  - 裏金金額
  - 公認・非公認ステータス
  - 党からの処分内容

### 壺議員（33名）
- **対象**: 統一教会との関係が指摘された議員
- **データ項目**:
  - 議員名・写真（Wikipedia連携）
  - 事務所住所
  - 分類

## 機能

### 主要機能
- **リアルタイム検索**: 政治家名、選挙区、エリアでの即時検索
- **タブ切り替え**: 裏金議員と壺議員の情報を簡単に切り替え
- **フィルタリング**: エリアやステータスによる絞り込み
- **レスポンシブデザイン**: PC・タブレット・スマートフォン対応
- **Wikipedia連携**: 政治家の写真と詳細情報への自動リンク

###  UI/UX特徴
- **アクセシビリティ対応**: キーボードナビゲーション、スクリーンリーダー対応
- **ダークモード対応**: システム設定に応じた自動切り替え
- **パフォーマンス最適化**: 仮想スクロール、レイジーローディング
- **印刷対応**: 印刷時に最適化されたレイアウト


## 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **デザイン**: CSS Grid, Flexbox, CSS カスタムプロパティ
- **フォント**: Noto Sans JP (Google Fonts)
- **API連携**: Wikipedia REST API
- **データ形式**: YAML, CSV, Markdown

## 対応ブラウザ

- Chrome 70+
- Firefox 70+
- Safari 13+
- Edge 79+
- iOS Safari 13+
- Android Chrome 70+

## 使用方法

### オンラインアクセス
ブラウザで以下のファイルを開いてください：
```
src/index.html
```

### ローカル開発
1. プロジェクトをクローンまたはダウンロード
2. ローカルサーバーを起動（推奨）
3. ブラウザで `src/index.html` にアクセス


## キーボードショートカット

- `Ctrl/Cmd + 1`: 裏金議員タブに切り替え
- `Ctrl/Cmd + 2`: 壺議員タブに切り替え
- `Ctrl/Cmd + F`: 検索ボックスにフォーカス

## データソース

データは以下の信頼できる公開情報源から収集されています：

- 国会議事録
- 新聞報道
- 政府発表資料
- 政治資金収支報告書
- 国会質疑応答

## カスタマイズ

### データの更新
`src/index.html` 内の `embeddedData` オブジェクトを編集してデータを更新できます：

```javascript
const embeddedData = {
    uragane: [
        // 裏金議員データ
    ],
    tsubo: [
        // 壺議員データ
    ]
};
```

### スタイルのカスタマイズ
CSS カスタムプロパティを使用してテーマを簡単に変更できます：

```css
:root {
    --primary-color: #2563eb;
    --danger-color: #dc2626;
    --background-color: #f8fafc;
    /* その他の変数 */
}
```

## コントリビューション

### データの修正・追加
1. `lists/` フォルダ内のデータファイルを確認
2. 修正提案をIssueで報告
3. Pull Requestを提出

### バグ報告
以下の情報を含めてIssueを作成してください：
- ブラウザとバージョン
- 再現手順
- 期待される動作
- 実際の動作

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 免責事項

- 本データベースは公開情報に基づいて作成されています
- 情報の正確性については最善を尽くしていますが、完全性は保証されません
- 政治的立場を表明するものではありません
- 教育・情報提供を目的としています

## 連絡先

プロジェクトに関するお問い合わせや提案がありましたら、GitHub Issueまでお知らせください。


---

<div align="center" style="font-style: italic; padding: 10px;">
<p>このプロジェクトは政治的透明性の向上を目的とした教育・情報提供プロジェクトです。特定の政党や個人を誹謗中傷する意図はないことを表明します。</p>
<p>__This contents are  Generated by AI Assistant__ </p>
</div>