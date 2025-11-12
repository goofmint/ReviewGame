---
title: "レベル3: 非同期処理の問題"
difficulty: 3
language: javascript
---

# 要件

複数のAPIエンドポイントからデータを取得し、すべてのデータを結合して返す関数を実装してください。
- すべてのAPIリクエストは並列で実行する
- 1つでも失敗した場合はエラーを返す
- タイムアウトは5秒とする
- 空の配列が渡された場合は空の配列を返す

# コード

```javascript
async function fetchAllData(urls) {
  const results = [];
  for (const url of urls) {
    const response = await fetch(url);
    const data = await response.json();
    results.push(data);
  }
  return results;
}
```

# 評価基準

LLMがユーザーのレビューを評価する際の基準：
- 並列実行されていない（Promise.allを使うべき）ことを指摘できているか
- エラーハンドリング（try-catch）の欠如を指摘できているか
- タイムアウト処理の欠如を指摘できているか
- HTTPステータスコードのチェックがないことを指摘できているか
- 入力バリデーション（空配列、null/undefined）の欠如を指摘できているか
