---
title: "レベル3: リストパフォーマンスの問題"
difficulty: 3
language: flutter
---

# 要件

大量のアイテムを表示するリストウィジェットを実装してください。
- 1000個以上のアイテムを効率的に表示する
- 各アイテムはタップ可能で、選択状態を管理する
- 選択されたアイテムは見た目が変わる
- スクロールパフォーマンスを最適化する
- メモリ効率を考慮する

# コード

```dart
class ItemListWidget extends StatefulWidget {
  final List<String> items;

  ItemListWidget({required this.items});

  @override
  _ItemListWidgetState createState() => _ItemListWidgetState();
}

class _ItemListWidgetState extends State<ItemListWidget> {
  Set<int> selectedIndices = {};

  @override
  Widget build(BuildContext context) {
    return Column(
      children: widget.items.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;
        final isSelected = selectedIndices.contains(index);

        return GestureDetector(
          onTap: () {
            setState(() {
              if (isSelected) {
                selectedIndices.remove(index);
              } else {
                selectedIndices.add(index);
              }
            });
          },
          child: Container(
            color: isSelected ? Colors.blue : Colors.white,
            padding: EdgeInsets.all(16),
            child: Text(item),
          ),
        );
      }).toList(),
    );
  }
}
```

# 評価基準

LLMがユーザーのレビューを評価する際の基準：
- ListView.builderを使用していないパフォーマンス問題を指摘できているか（すべてのウィジェットが一度に生成される）
- Columnの代わりにListViewを使うべきことを指摘できているか（スクロール可能性）
- 不要な再描画を避けるための最適化（const、Key）の提案ができているか
- InkWellやListTileなどのマテリアルデザインウィジェットの使用を提案できているか
- 大規模リストでのメモリ使用量の問題を指摘できているか
