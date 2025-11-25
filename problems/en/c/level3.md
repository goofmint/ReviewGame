---
title: "Level 3: Multithreaded Processing"
difficulty: 3
language: c
---

# Requirements

- Generate the specified number of threads (THREAD_COUNT), with each thread incrementing a shared counter for the specified number of iterations (LOOP_COUNT).
- The shared counter update must be protected with appropriate synchronization mechanisms (mutex or atomic operations) to prevent race conditions between threads.
- The main thread must correctly wait for all worker threads to complete (join).
- After all threads have finished, display the shared counter value along with the expected value (THREAD_COUNT × LOOP_COUNT) and verify that it is correct.

# Code

```c
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#define THREAD_COUNT 4
#define LOOP_COUNT   1000000

static int global_counter = 0;

void *worker(void *arg) {
    int i;
    int id = *(int *)arg;

    for (i = 0; i < LOOP_COUNT; i++) {
        global_counter++;
    }

    printf("thread %d finished\n", id);
    return NULL;
}

int main(void) {
    pthread_t threads[THREAD_COUNT];
    int i;
    int ids[THREAD_COUNT];

    for (i = 0; i < THREAD_COUNT; i++) {
        ids[i] = i;
        pthread_create(&threads[i], NULL, worker, &i);
    }

    for (i = 0; i < THREAD_COUNT; i++) {
        pthread_join(threads[i], NULL);
    }

    printf("global_counter = %d (expected %d)\n",
           global_counter, THREAD_COUNT * LOOP_COUNT);

    return 0;
}
```

# Evaluation Criteria

- Data Race
Concurrent access to `global_counter` from multiple threads is not synchronized. Use `pthread_mutex_t` for lock protection or employ atomic operations.
- Pointer Race
The `&i` pointer passed to threads points to the loop variable, which may change while threads are executing. Pass an independent copy of the value for each thread.
- Thread Creation and Argument Passing Safety
For the 4th argument of `pthread_create`, pass a unique area for each thread (e.g., `&ids[i]`) rather than the address of a temporary or loop variable. Also check the return value of `pthread_create` and ensure proper handling of failures (logging, abnormal termination, etc.).
- Thread Join Verification
Is `pthread_join` called for all threads (THREAD_COUNT)? Check the return value of `pthread_join` as needed and verify that error cases are not being ignored.
- Counter Type, Display, and Expected Value Check Validity
  - Is the type of `global_counter` chosen to avoid overflow risk?
  - Does the printf format specifier match the variable type?
  - Is the logic for comparing and displaying the actual `global_counter` and expected value (`THREAD_COUNT * LOOP_COUNT`) correctly implemented?
