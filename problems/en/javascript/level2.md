---
title: "Level 2: Array Manipulation Bug"
difficulty: 2
language: javascript
locale: en
---

# Requirements

Implement a function that removes duplicates from an array and returns a new array.
- Do not modify the original array
- Preserve the order of first appearance
- Return an empty array if an empty array is passed
- Throw an error if null or undefined is passed

# Code

```javascript
function removeDuplicates(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (result.indexOf(arr[i]) === -1) {
      result.push(arr[i]);
    }
  }
  return result;
}
```

# Evaluation Criteria

Criteria for LLM to evaluate user's review:
- Can identify the missing null/undefined check
- Can identify handling for non-array values
- Can suggest performance improvements (e.g., using Set)
- Can explain that the original array is not modified (requirement is met) but note this explicitly
