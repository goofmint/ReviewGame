---
title: "レベル2: 配列操作のバグ"
difficulty: 2
language: javascript
---

# 要件

配列から重複を除去して新しい配列を返す関数を実装してください。
- 元の配列は変更しない
- 順序は最初に出現した順を保持する
- 空配列の場合は空配列を返す
- nullやundefinedが渡された場合はエラーを投げる

# コード

```javascript
function removeDuplicates(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (result.indexOf(arr[i]) === -1) {
      result.push(arr[i]);
    }
  }
  return result;
}
```

# 評価基準

LLMがユーザーのレビューを評価する際の基準：
- null/undefinedチェックの欠如を指摘できているか
- 配列以外の値が渡された場合のハンドリングを指摘できているか
- パフォーマンス改善の提案（Setの使用など）ができているか
- 元の配列が変更されないことは満たしているが、それを明示的に説明できているか
