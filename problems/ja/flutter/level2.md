---
title: "レベル2: 状態管理の問題"
difficulty: 2
language: flutter
---

# 要件

カウンターアプリを実装してください。
- ボタンをタップするとカウントが増える
- カウントをリセットするボタンも用意する
- カウントが10の倍数になったら特別なメッセージを表示する
- 状態の変更は適切に管理される必要がある

# コード

```dart
class CounterWidget extends StatefulWidget {
  @override
  _CounterWidgetState createState() => _CounterWidgetState();
}

class _CounterWidgetState extends State<CounterWidget> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Count: $count'),
        ElevatedButton(
          onPressed: () {
            count++;
          },
          child: Text('Increment'),
        ),
        ElevatedButton(
          onPressed: () {
            count = 0;
          },
          child: Text('Reset'),
        ),
      ],
    );
  }
}
```

# 評価基準

LLMがユーザーのレビューを評価する際の基準：
- setStateの欠如を指摘できているか（状態が更新されてもUIが再描画されない）
- 10の倍数での特別なメッセージ表示の要件が実装されていないことを指摘できているか
- ウィジェットツリーの最適化（const使用）の提案ができているか
- アクセシビリティ（ボタンのセマンティクスラベル）の提案ができているか
