---
title: "レベル1: 数値処理"
difficulty: 1
language: c
---

# 要件

- ユーザーから整数のリストを入力として受け取り、その合計と平均を計算して表示するCプログラムを実装してください。
- 入力される整数の数は最大100個とします。
- 入力値の検証を行い、無効な入力に対して適切なエラーメッセージを表示してください。
- 配列の境界を超えるアクセスを防止してください。

# コード

```c
#include <stdio.h>

int main(void) {
    int numbers[100];
    int count;
    int i;
    int sum = 0;
    double average;

    printf("何個の整数を入力しますか？(最大100): ");
    scanf("%d", &count);

    /* 入力された個数だけ整数を読み込む */
    for (i = 0; i <= count; i++) {
        printf("%d 番目の整数を入力してください: ", i + 1);
        scanf("%d", &numbers[i]);
        sum += numbers[i];
    }

    average = sum / count;

    printf("合計: %d\n", sum);
    printf("平均: %f\n", average);

    return 0;
}
```

# 評価基準

- バウンダリ問題  
ループ条件 i <= count により配列外アクセスが発生。i < count に修正が必要です。また、入力値に対する検証（count > 100 の場合の拒否）を追加してください。
- 型変換の誤り  
sum / count（整数除算）の結果をdoubleに代入しているため、精度が失われています。代わりに (double)sum / count でキャストしてから計算してください。
- 入力検証の欠如  
ユーザーが負の数や非整数を入力した場合の処理がありません。
- scanfの戻り値チェックの欠如  
scanfの戻り値を確認し、正しく整数が読み込まれたかを検証してください。

