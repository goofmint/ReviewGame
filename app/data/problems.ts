// このファイルは自動生成されます。直接編集しないでください。
export const problems = {
  "javascript": {
    "1": {
      "title": "レベル1: 基本的なバグ発見",
      "difficulty": 1,
      "language": "javascript",
      "requirements": "ユーザーの年齢を検証する関数を実装してください。\n- 年齢は0以上150以下の整数である必要がある\n- 不正な値の場合はエラーを投げる",
      "code": "function validateAge(age) {\n  if (age < 0) {\n    throw new Error('年齢は0以上である必要があります');\n  }\n  return true;\n}",
      "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- 上限チェック（150以下）の欠如を指摘できているか\n- 型チェック（数値型、整数）の欠如を指摘できているか\n- 具体的な改善提案を提示できているか\n- エラーハンドリングの不足を指摘できているか"
    }
  }
} as const;
export const availableLanguages = ["javascript"] as const;
