---
title: "Level 3: Async Processing Issues"
difficulty: 3
language: javascript
locale: en
---

# Requirements

Implement a function that fetches data from multiple API endpoints and returns all combined data.
- Execute all API requests in parallel
- Return an error if any request fails
- Set timeout to 5 seconds
- Return an empty array if an empty array is passed

# Code

```javascript
async function fetchAllData(urls) {
  const results = [];
  for (const url of urls) {
    const response = await fetch(url);
    const data = await response.json();
    results.push(data);
  }
  return results;
}
```

# Evaluation Criteria

Criteria for LLM to evaluate user's review:
- Can identify that requests are not executed in parallel (should use Promise.all)
- Can identify missing error handling (try-catch)
- Can identify missing timeout handling
- Can identify missing HTTP status code check
- Can identify missing input validation (empty array, null/undefined)
