---
title: "Level 3: List Performance Issues"
difficulty: 3
language: flutter
locale: en
---

# Requirements

Implement a list widget that displays a large number of items.
- Efficiently display 1000+ items
- Each item is tappable and manages its selection state
- Selected items should change appearance
- Optimize scroll performance
- Consider memory efficiency

# Code

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

# Evaluation Criteria

Criteria for LLM to evaluate user's review:
- Can identify performance issues from not using ListView.builder (all widgets are created at once)
- Can identify that ListView should be used instead of Column (scrollability)
- Can suggest optimizations to avoid unnecessary re-renders (const, Key)
- Can suggest using Material Design widgets like InkWell or ListTile
- Can identify memory usage issues with large lists
