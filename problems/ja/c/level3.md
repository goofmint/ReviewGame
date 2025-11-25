---
title: "レベル3: マルチスレッド処理"
difficulty: 3
language: c
---

# 要件

- 指定されたスレッド数（THREAD_COUNT）を生成し、各スレッドが指定回数（LOOP_COUNT）だけ共有カウンタをインクリメントすること。
- 共有カウンタの更新はスレッド間競合が発生しないよう、適切な同期手段（ミューテックスまたはアトミック操作）で保護されていること。
- メインスレッドは全ワーカースレッドの終了（join）を正しく待ち合わせること。
- 全スレッド終了後、共有カウンタの値を期待値（THREAD_COUNT × LOOP_COUNT）とともに表示し、正しい値であることを確認できること。

# コード

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

# 評価基準

- データレース  
global_counter への複数スレッドからの同時アクセスが同期されていません。pthread_mutex_t でロック保護するか、アトミック操作を使用してください。
- ポインタレース  
スレッドに渡される &i ポインタは、ループ変数を指しており、スレッドが実行中に i が変更される可能性があります。スレッドごとに独立した値をコピーして渡してください。
- スレッド生成・引数受け渡しの実装が安全であること
`pthread_create` の第4引数として、一時変数やループ変数のアドレスではなく、スレッドごとにユニークな領域（例: `ids[i]`）を渡しましょう。また、`pthread_create` の戻り値をチェックし、失敗時の扱い（ログ出力・異常終了など）が妥当であることを確認してください。
- スレッド終了待ち（join）判定  
すべてのスレッド（`THREAD_COUNT` 個）に対して `pthread_join` が呼ばれていますか。`pthread_join` の戻り値を必要に応じて確認し、異常系を無視していないかもチェックしてください。
- カウンタ値の型・表示・期待値チェックの妥当性  
  - `global_counter` の型がオーバーフローのリスクを考慮したものになっていますか
  - `printf` のフォーマット指定子が変数の型と一致していますか
  - 実際の `global_counter` と期待値（`THREAD_COUNT * LOOP_COUNT`）を比較・表示するロジックが正しく実装されていますか
