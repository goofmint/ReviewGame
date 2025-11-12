---
title: "レベル3: クラス設計の問題"
difficulty: 3
language: python
---

# 要件

銀行口座を表すクラスを実装してください。
- 初期残高は0以上でなければならない
- 預金（deposit）と引き出し（withdraw）メソッドを持つ
- 残高を超える引き出しはエラーを発生させる
- 負の金額での預金・引き出しはエラーを発生させる
- 残高は外部から直接変更できないようにする

# コード

```python
class BankAccount:
    def __init__(self, initial_balance):
        self.balance = initial_balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def withdraw(self, amount):
        self.balance -= amount
        return self.balance
```

# 評価基準

LLMがユーザーのレビューを評価する際の基準：
- 初期残高の検証（0以上）が欠如していることを指摘できているか
- 預金額・引き出し額の検証（正の数）が欠如していることを指摘できているか
- 残高不足チェックが欠如していることを指摘できているか
- balance属性がpublicであることのセキュリティ問題を指摘できているか（_balanceやプロパティの使用を提案）
- 型チェック（amountが数値かどうか）の欠如を指摘できているか
