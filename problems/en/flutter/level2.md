---
title: "Level 2: State Management Issues"
difficulty: 2
language: flutter
locale: en
---

# Requirements

Implement a counter app.
- Tapping the button increments the count
- Provide a button to reset the count
- Display a special message when the count is a multiple of 10
- State changes must be properly managed

# Code

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

# Evaluation Criteria

Criteria for LLM to evaluate user's review:
- Can identify missing setState (UI won't re-render when state changes)
- Can identify that the special message requirement for multiples of 10 is not implemented
- Can suggest widget tree optimization (using const)
- Can suggest accessibility improvements (semantic labels for buttons)
