---
title: "レベル1: リスト処理の基本"
difficulty: 1
language: python
---

# 要件

リスト内の偶数のみを抽出して新しいリストを返す関数を実装してください。
- 元のリストは変更しない
- 空のリストの場合は空のリストを返す
- 数値以外の要素が含まれる場合はエラーを発生させる
- Noneが渡された場合はエラーを発生させる

# コード

```python
def filter_even_numbers(numbers):
    result = []
    for num in numbers:
        if num % 2 == 0:
            result.append(num)
    return result
```

# 評価基準

LLMがユーザーのレビューを評価する際の基準：
- Noneチェックの欠如を指摘できているか
- 型チェック（数値以外の要素）の欠如を指摘できているか
- リスト以外の値が渡された場合のハンドリングを指摘できているか
- Pythonic な書き方（リスト内包表記）の提案ができているか（ボーナスポイント）
