---
title: "Level 2: Array Data Manipulation"
difficulty: 2
language: c
locale: en
---

# Requirements

- Implement a C program that dynamically allocates an array to store integers based on the user-input value `count`.
- Find and display the maximum value from the input integers.
- Ensure all values stored in the array are readable.
- Provide appropriate error output and terminate processing when necessary.
- Properly deallocate used memory before program termination.

# Code

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *data;
    int count;
    int i;
    int max = 0;

    printf("Enter the number of elements: ");
    if (scanf("%d", &count) != 1) {
        printf("Input error\n");
        return 1;
    }

    data = malloc(sizeof(int *) * count);
    if (data == NULL) {
        printf("Memory allocation failed\n");
        return 1;
    }

    for (i = 0; i < count; i++) {
        printf("Enter value #%d: ", i + 1);
        scanf("%d", &data[i]);
        if (data[i] > max) {
            max = data[i];
        }
    }

    printf("The maximum value is %d\n", max);

    return 0;
}
```

# Evaluation Criteria

- Memory Allocation Error
`malloc(sizeof(int *) * count)` is incorrect. It should be `malloc(sizeof(int) * count)` or `calloc(count, sizeof(int))`.
- Initialization Issue
Initializing with `max = 0` returns incorrect results when the input contains only negative values. Initialize with the first element or use `INT_MIN`.
- Memory Leak
The memory allocated with `malloc` is not freed with `free`. It must be deallocated before program termination.
- Lack of Input Validation
Verify the return value of `scanf` to ensure integers were successfully read.
