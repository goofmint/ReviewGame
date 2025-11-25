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
- null値の処理とconstコンストラクタが必要であることを指摘できているか
  StatelessWidgetのコンストラクタはパフォーマンス向上のためconstにすべきです。
- Paddingの欠如の指摘
  Cardの内部にpaddingがないため、テキストがカードの端に接触し、見た目が悪くなります
- テキストオーバーフロー処理の欠如の指摘
  長いテキストが渡された場合、レイアウトが崩れる可能性があります。overflow: TextOverflow.ellipsisとmaxLinesを指定すべきです
- アクセシビリティの欠如の指摘
  スクリーンリーダーのためにSemanticsウィジェットでラベルを提供すべきです
