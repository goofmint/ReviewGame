---
title: "Level 1: Basic Bug Detection"
difficulty: 1
language: javascript
locale: en
---

# Requirements

Implement a function to validate user age.
- Age must be an integer between 0 and 150
- Throw an error for invalid values

# Code

```javascript
function validateAge(age) {
  if (age < 0) {
    throw new Error('Age must be 0 or greater');
  }
  return true;
}
```

# Evaluation Criteria

Criteria for LLM to evaluate user's review:
- Can identify the missing upper bound check (150 or less)
- Can identify the missing type validation (number type, integer check)
- Can provide specific improvement suggestions
- Can identify insufficient error handling
