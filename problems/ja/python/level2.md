---
title: "レベル2: 辞書操作の問題"
difficulty: 2
language: python
---

# 要件

ユーザー情報の辞書から特定のキーの値を安全に取得する関数を実装してください。
- キーが存在しない場合はデフォルト値を返す
- ネストされた辞書にも対応する（例: "user.profile.name"）
- Noneや辞書以外の値が渡された場合はエラーを発生させる
- キーパスが不正な場合はデフォルト値を返す

# コード

```python
def get_nested_value(data, key_path, default=None):
    keys = key_path.split('.')
    value = data
    for key in keys:
        value = value[key]
    return value
```

# 評価基準

LLMがユーザーのレビューを評価する際の基準：
- KeyErrorが発生する可能性を指摘できているか
- try-exceptまたはgetメソッドの使用を提案できているか
- 型チェック（data が辞書かどうか）の欠如を指摘できているか
- key_pathの入力バリデーション（空文字列など）の欠如を指摘できているか
- 途中のキーが辞書でない場合の処理の欠如を指摘できているか
