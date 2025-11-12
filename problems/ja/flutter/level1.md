---
title: "レベル1: Widget構造の基本"
difficulty: 1
language: flutter
---

# 要件

ユーザー情報を表示するシンプルなカードウィジェットを実装してください。
- ユーザー名とメールアドレスを表示する
- null値が渡された場合は適切なデフォルト表示をする
- テキストが長い場合は省略記号（...）で切り詰める
- アクセシビリティを考慮する（Semanticsウィジェット）

# コード

```dart
class UserCard extends StatelessWidget {
  final String username;
  final String email;

  UserCard({required this.username, required this.email});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text(username, style: TextStyle(fontSize: 20)),
          Text(email),
        ],
      ),
    );
  }
}
```

# 評価基準

LLMがユーザーのレビューを評価する際の基準：
- Paddingの欠如を指摘できているか（UIの見た目）
- テキストのオーバーフローハンドリング（overflow: TextOverflow.ellipsis）の欠如を指摘できているか
- null安全性の考慮（nullable パラメータまたはデフォルト値）の欠如を指摘できているか
- アクセシビリティ（Semantics）の欠如を指摘できているか
- constコンストラクタの使用提案ができているか（パフォーマンス向上）
