---
title: "レベル2: 配列データの操作"
difficulty: 2
language: c
---

# 要件

- ユーザーが入力する整数値 count に従い、その個数分の整数を格納する配列を動的に確保するCプログラムを実装してください。
- 入力された整数群の中から最大値を求めて表示してください。
- 配列に格納した値はすべて読み取れる状態としてください。
- 適切にエラー出力を行い処理を終了してください。
- 使用したメモリ領域は、処理終了前に適切に解放してください

# コード

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *data;
    int count;
    int i;
    int max = 0;

    printf("要素数を入力してください: ");
    if (scanf("%d", &count) != 1) {
        printf("入力エラーです\n");
        return 1;
    }

    data = malloc(sizeof(int *) * count);
    if (data == NULL) {
        printf("メモリ確保に失敗しました\n");
        return 1;
    }

    for (i = 0; i < count; i++) {
        printf("%d 番目の値を入力してください: ", i + 1);
        scanf("%d", &data[i]);
        if (data[i] > max) {
            max = data[i];
        }
    }

    printf("最大値は %d です\n", max);

    return 0;
}
```

# 評価基準

- メモリ割り当てエラー  
malloc(sizeof(int *) * count) は誤りです。正しくは malloc(sizeof(int) * count) または calloc(count, sizeof(int)) を使用すべきです。
- 初期化問題  
max = 0 で初期化すると、負の値のみを含む入力の場合、不正な結果が返されます。最初の要素で初期化するか、INT_MIN を使用してください。
- メモリリーク  
malloc で割り当てたメモリに対して free を呼び出していません。プログラム終了前に必ず解放してください。
- 入力検証の欠如  
scanf の戻り値を確認し、正しく整数が読み込まれたかを検証してください。
