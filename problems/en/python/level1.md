---
title: "Level 1: Basic List Processing"
difficulty: 1
language: python
locale: en
---

# Requirements

Implement a function that extracts only even numbers from a list and returns a new list.
- Do not modify the original list
- Return an empty list if an empty list is passed
- Raise an error if non-numeric elements are included
- Raise an error if None is passed

# Code

```python
def filter_even_numbers(numbers):
    result = []
    for num in numbers:
        if num % 2 == 0:
            result.append(num)
    return result
```

# Evaluation Criteria

Criteria for LLM to evaluate user's review:
- Can identify the missing None check
- Can identify the missing type check (non-numeric elements)
- Can identify handling for non-list values
- Can suggest Pythonic improvements (list comprehension) as a bonus point
