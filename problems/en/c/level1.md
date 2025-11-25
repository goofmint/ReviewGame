---
title: "Level 1: Number Processing"
difficulty: 1
language: c
locale: en
---

# Requirements

- Implement a C program that receives a list of integers from the user, calculates and displays their sum and average.
- The maximum number of input integers should be 100.
- Validate input values and display appropriate error messages for invalid inputs.
- Prevent accessing beyond array boundaries.

# Code

```c
#include <stdio.h>

int main(void) {
    int numbers[100];
    int count;
    int i;
    int sum = 0;
    double average;

    printf("How many integers will you enter? (max 100): ");
    scanf("%d", &count);

    /* Read integers based on the input count */
    for (i = 0; i <= count; i++) {
        printf("Enter integer #%d: ", i + 1);
        scanf("%d", &numbers[i]);
        sum += numbers[i];
    }

    average = sum / count;

    printf("Sum: %d\n", sum);
    printf("Average: %f\n", average);

    return 0;
}
```

# Evaluation Criteria

- Boundary Issues
The loop condition `i <= count` causes out-of-bounds array access. It must be corrected to `i < count`. Additionally, add validation for input values (reject when count > 100).
- Type Conversion Error
The result of `sum / count` (integer division) is assigned to a double, causing precision loss. Instead, cast before calculation using `(double)sum / count`.
- Lack of Input Validation
There is no handling for cases where the user enters negative numbers or non-integer values.
- Missing scanf Return Value Check
Verify the return value of scanf to ensure integers were successfully read.
