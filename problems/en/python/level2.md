---
title: "Level 2: Dictionary Manipulation Issues"
difficulty: 2
language: python
locale: en
---

# Requirements

Implement a function to safely retrieve values from a user information dictionary by key.
- Return a default value if the key does not exist
- Support nested dictionaries (e.g., "user.profile.name")
- Raise an error if None or non-dictionary values are passed
- Return the default value if the key path is invalid

# Code

```python
def get_nested_value(data, key_path, default=None):
    keys = key_path.split('.')
    value = data
    for key in keys:
        value = value[key]
    return value
```

# Evaluation Criteria

Criteria for LLM to evaluate user's review:
- Can identify the possibility of KeyError
- Can suggest using try-except or the get method
- Can identify the missing type check (whether data is a dictionary)
- Can identify the missing input validation for key_path (e.g., empty string)
- Can identify missing handling when intermediate keys are not dictionaries
