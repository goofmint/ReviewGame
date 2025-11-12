---
title: "Level 1: Basic Widget Structure"
difficulty: 1
language: flutter
locale: en
---

# Requirements

Implement a simple card widget that displays user information.
- Display username and email address
- Show appropriate default display when null values are passed
- Truncate long text with ellipsis (...)
- Consider accessibility (Semantics widget)

# Code

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

# Evaluation Criteria

Criteria for LLM to evaluate user's review:
- Can identify missing Padding (UI appearance)
- Can identify missing text overflow handling (overflow: TextOverflow.ellipsis)
- Can identify missing null safety consideration (nullable parameters or default values)
- Can identify missing accessibility (Semantics)
- Can suggest using const constructor (performance improvement)
