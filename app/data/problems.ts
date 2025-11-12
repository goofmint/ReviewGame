// このファイルは自動生成されます。直接編集しないでください。
export const problems = {
  "en": {
    "flutter": {
      "1": {
        "title": "Level 1: Basic Widget Structure",
        "difficulty": 1,
        "language": "flutter",
        "locale": "en",
        "requirements": "Implement a simple card widget that displays user information.\n- Display username and email address\n- Show appropriate default display when null values are passed\n- Truncate long text with ellipsis (...)\n- Consider accessibility (Semantics widget)",
        "code": "class UserCard extends StatelessWidget {\n  final String username;\n  final String email;\n\n  UserCard({required this.username, required this.email});\n\n  @override\n  Widget build(BuildContext context) {\n    return Card(\n      child: Column(\n        children: [\n          Text(username, style: TextStyle(fontSize: 20)),\n          Text(email),\n        ],\n      ),\n    );\n  }\n}",
        "evaluationCriteria": "Criteria for LLM to evaluate user's review:\n- Can identify missing Padding (UI appearance)\n- Can identify missing text overflow handling (overflow: TextOverflow.ellipsis)\n- Can identify missing null safety consideration (nullable parameters or default values)\n- Can identify missing accessibility (Semantics)\n- Can suggest using const constructor (performance improvement)"
      },
      "2": {
        "title": "Level 2: State Management Issues",
        "difficulty": 2,
        "language": "flutter",
        "locale": "en",
        "requirements": "Implement a counter app.\n- Tapping the button increments the count\n- Provide a button to reset the count\n- Display a special message when the count is a multiple of 10\n- State changes must be properly managed",
        "code": "class CounterWidget extends StatefulWidget {\n  @override\n  _CounterWidgetState createState() => _CounterWidgetState();\n}\n\nclass _CounterWidgetState extends State<CounterWidget> {\n  int count = 0;\n\n  @override\n  Widget build(BuildContext context) {\n    return Column(\n      children: [\n        Text('Count: $count'),\n        ElevatedButton(\n          onPressed: () {\n            count++;\n          },\n          child: Text('Increment'),\n        ),\n        ElevatedButton(\n          onPressed: () {\n            count = 0;\n          },\n          child: Text('Reset'),\n        ),\n      ],\n    );\n  }\n}",
        "evaluationCriteria": "Criteria for LLM to evaluate user's review:\n- Can identify missing setState (UI won't re-render when state changes)\n- Can identify that the special message requirement for multiples of 10 is not implemented\n- Can suggest widget tree optimization (using const)\n- Can suggest accessibility improvements (semantic labels for buttons)"
      },
      "3": {
        "title": "Level 3: List Performance Issues",
        "difficulty": 3,
        "language": "flutter",
        "locale": "en",
        "requirements": "Implement a list widget that displays a large number of items.\n- Efficiently display 1000+ items\n- Each item is tappable and manages its selection state\n- Selected items should change appearance\n- Optimize scroll performance\n- Consider memory efficiency",
        "code": "class ItemListWidget extends StatefulWidget {\n  final List<String> items;\n\n  ItemListWidget({required this.items});\n\n  @override\n  _ItemListWidgetState createState() => _ItemListWidgetState();\n}\n\nclass _ItemListWidgetState extends State<ItemListWidget> {\n  Set<int> selectedIndices = {};\n\n  @override\n  Widget build(BuildContext context) {\n    return Column(\n      children: widget.items.asMap().entries.map((entry) {\n        final index = entry.key;\n        final item = entry.value;\n        final isSelected = selectedIndices.contains(index);\n\n        return GestureDetector(\n          onTap: () {\n            setState(() {\n              if (isSelected) {\n                selectedIndices.remove(index);\n              } else {\n                selectedIndices.add(index);\n              }\n            });\n          },\n          child: Container(\n            color: isSelected ? Colors.blue : Colors.white,\n            padding: EdgeInsets.all(16),\n            child: Text(item),\n          ),\n        );\n      }).toList(),\n    );\n  }\n}",
        "evaluationCriteria": "Criteria for LLM to evaluate user's review:\n- Can identify performance issues from not using ListView.builder (all widgets are created at once)\n- Can identify that ListView should be used instead of Column (scrollability)\n- Can suggest optimizations to avoid unnecessary re-renders (const, Key)\n- Can suggest using Material Design widgets like InkWell or ListTile\n- Can identify memory usage issues with large lists"
      }
    },
    "javascript": {
      "1": {
        "title": "Level 1: Basic Bug Detection",
        "difficulty": 1,
        "language": "javascript",
        "locale": "en",
        "requirements": "Implement a function to validate user age.\n- Age must be an integer between 0 and 150\n- Throw an error for invalid values",
        "code": "function validateAge(age) {\n  if (age < 0) {\n    throw new Error('Age must be 0 or greater');\n  }\n  return true;\n}",
        "evaluationCriteria": "Criteria for LLM to evaluate user's review:\n- Can identify the missing upper bound check (150 or less)\n- Can identify the missing type validation (number type, integer check)\n- Can provide specific improvement suggestions\n- Can identify insufficient error handling"
      },
      "2": {
        "title": "Level 2: Array Manipulation Bug",
        "difficulty": 2,
        "language": "javascript",
        "locale": "en",
        "requirements": "Implement a function that removes duplicates from an array and returns a new array.\n- Do not modify the original array\n- Preserve the order of first appearance\n- Return an empty array if an empty array is passed\n- Throw an error if null or undefined is passed",
        "code": "function removeDuplicates(arr) {\n  const result = [];\n  for (let i = 0; i < arr.length; i++) {\n    if (result.indexOf(arr[i]) === -1) {\n      result.push(arr[i]);\n    }\n  }\n  return result;\n}",
        "evaluationCriteria": "Criteria for LLM to evaluate user's review:\n- Can identify the missing null/undefined check\n- Can identify handling for non-array values\n- Can suggest performance improvements (e.g., using Set)\n- Can explain that the original array is not modified (requirement is met) but note this explicitly"
      },
      "3": {
        "title": "Level 3: Async Processing Issues",
        "difficulty": 3,
        "language": "javascript",
        "locale": "en",
        "requirements": "Implement a function that fetches data from multiple API endpoints and returns all combined data.\n- Execute all API requests in parallel\n- Return an error if any request fails\n- Set timeout to 5 seconds\n- Return an empty array if an empty array is passed",
        "code": "async function fetchAllData(urls) {\n  const results = [];\n  for (const url of urls) {\n    const response = await fetch(url);\n    const data = await response.json();\n    results.push(data);\n  }\n  return results;\n}",
        "evaluationCriteria": "Criteria for LLM to evaluate user's review:\n- Can identify that requests are not executed in parallel (should use Promise.all)\n- Can identify missing error handling (try-catch)\n- Can identify missing timeout handling\n- Can identify missing HTTP status code check\n- Can identify missing input validation (empty array, null/undefined)"
      }
    },
    "python": {
      "1": {
        "title": "Level 1: Basic List Processing",
        "difficulty": 1,
        "language": "python",
        "locale": "en",
        "requirements": "Implement a function that extracts only even numbers from a list and returns a new list.\n- Do not modify the original list\n- Return an empty list if an empty list is passed\n- Raise an error if non-numeric elements are included\n- Raise an error if None is passed",
        "code": "def filter_even_numbers(numbers):\n    result = []\n    for num in numbers:\n        if num % 2 == 0:\n            result.append(num)\n    return result",
        "evaluationCriteria": "Criteria for LLM to evaluate user's review:\n- Can identify the missing None check\n- Can identify the missing type check (non-numeric elements)\n- Can identify handling for non-list values\n- Can suggest Pythonic improvements (list comprehension) as a bonus point"
      },
      "2": {
        "title": "Level 2: Dictionary Manipulation Issues",
        "difficulty": 2,
        "language": "python",
        "locale": "en",
        "requirements": "Implement a function to safely retrieve values from a user information dictionary by key.\n- Return a default value if the key does not exist\n- Support nested dictionaries (e.g., \"user.profile.name\")\n- Raise an error if None or non-dictionary values are passed\n- Return the default value if the key path is invalid",
        "code": "def get_nested_value(data, key_path, default=None):\n    keys = key_path.split('.')\n    value = data\n    for key in keys:\n        value = value[key]\n    return value",
        "evaluationCriteria": "Criteria for LLM to evaluate user's review:\n- Can identify the possibility of KeyError\n- Can suggest using try-except or the get method\n- Can identify the missing type check (whether data is a dictionary)\n- Can identify the missing input validation for key_path (e.g., empty string)\n- Can identify missing handling when intermediate keys are not dictionaries"
      },
      "3": {
        "title": "Level 3: Class Design Issues",
        "difficulty": 3,
        "language": "python",
        "locale": "en",
        "requirements": "Implement a class representing a bank account.\n- Initial balance must be 0 or greater\n- Must have deposit and withdraw methods\n- Withdrawals exceeding the balance should raise an error\n- Deposits and withdrawals with negative amounts should raise an error\n- Balance should not be directly modifiable from outside",
        "code": "class BankAccount:\n    def __init__(self, initial_balance):\n        self.balance = initial_balance\n\n    def deposit(self, amount):\n        self.balance += amount\n        return self.balance\n\n    def withdraw(self, amount):\n        self.balance -= amount\n        return self.balance",
        "evaluationCriteria": "Criteria for LLM to evaluate user's review:\n- Can identify missing validation for initial balance (0 or greater)\n- Can identify missing validation for deposit/withdrawal amounts (positive numbers)\n- Can identify missing insufficient balance check\n- Can identify security issues with public balance attribute (suggest using _balance or property)\n- Can identify missing type check (whether amount is numeric)"
      }
    }
  },
  "ja": {
    "flutter": {
      "1": {
        "title": "レベル1: Widget構造の基本",
        "difficulty": 1,
        "language": "flutter",
        "locale": "ja",
        "requirements": "ユーザー情報を表示するシンプルなカードウィジェットを実装してください。\n- ユーザー名とメールアドレスを表示する\n- null値が渡された場合は適切なデフォルト表示をする\n- テキストが長い場合は省略記号（...）で切り詰める\n- アクセシビリティを考慮する（Semanticsウィジェット）",
        "code": "class UserCard extends StatelessWidget {\n  final String username;\n  final String email;\n\n  UserCard({required this.username, required this.email});\n\n  @override\n  Widget build(BuildContext context) {\n    return Card(\n      child: Column(\n        children: [\n          Text(username, style: TextStyle(fontSize: 20)),\n          Text(email),\n        ],\n      ),\n    );\n  }\n}",
        "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- Paddingの欠如を指摘できているか（UIの見た目）\n- テキストのオーバーフローハンドリング（overflow: TextOverflow.ellipsis）の欠如を指摘できているか\n- null安全性の考慮（nullable パラメータまたはデフォルト値）の欠如を指摘できているか\n- アクセシビリティ（Semantics）の欠如を指摘できているか\n- constコンストラクタの使用提案ができているか（パフォーマンス向上）"
      },
      "2": {
        "title": "レベル2: 状態管理の問題",
        "difficulty": 2,
        "language": "flutter",
        "locale": "ja",
        "requirements": "カウンターアプリを実装してください。\n- ボタンをタップするとカウントが増える\n- カウントをリセットするボタンも用意する\n- カウントが10の倍数になったら特別なメッセージを表示する\n- 状態の変更は適切に管理される必要がある",
        "code": "class CounterWidget extends StatefulWidget {\n  @override\n  _CounterWidgetState createState() => _CounterWidgetState();\n}\n\nclass _CounterWidgetState extends State<CounterWidget> {\n  int count = 0;\n\n  @override\n  Widget build(BuildContext context) {\n    return Column(\n      children: [\n        Text('Count: $count'),\n        ElevatedButton(\n          onPressed: () {\n            count++;\n          },\n          child: Text('Increment'),\n        ),\n        ElevatedButton(\n          onPressed: () {\n            count = 0;\n          },\n          child: Text('Reset'),\n        ),\n      ],\n    );\n  }\n}",
        "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- setStateの欠如を指摘できているか（状態が更新されてもUIが再描画されない）\n- 10の倍数での特別なメッセージ表示の要件が実装されていないことを指摘できているか\n- ウィジェットツリーの最適化（const使用）の提案ができているか\n- アクセシビリティ（ボタンのセマンティクスラベル）の提案ができているか"
      },
      "3": {
        "title": "レベル3: リストパフォーマンスの問題",
        "difficulty": 3,
        "language": "flutter",
        "locale": "ja",
        "requirements": "大量のアイテムを表示するリストウィジェットを実装してください。\n- 1000個以上のアイテムを効率的に表示する\n- 各アイテムはタップ可能で、選択状態を管理する\n- 選択されたアイテムは見た目が変わる\n- スクロールパフォーマンスを最適化する\n- メモリ効率を考慮する",
        "code": "class ItemListWidget extends StatefulWidget {\n  final List<String> items;\n\n  ItemListWidget({required this.items});\n\n  @override\n  _ItemListWidgetState createState() => _ItemListWidgetState();\n}\n\nclass _ItemListWidgetState extends State<ItemListWidget> {\n  Set<int> selectedIndices = {};\n\n  @override\n  Widget build(BuildContext context) {\n    return Column(\n      children: widget.items.asMap().entries.map((entry) {\n        final index = entry.key;\n        final item = entry.value;\n        final isSelected = selectedIndices.contains(index);\n\n        return GestureDetector(\n          onTap: () {\n            setState(() {\n              if (isSelected) {\n                selectedIndices.remove(index);\n              } else {\n                selectedIndices.add(index);\n              }\n            });\n          },\n          child: Container(\n            color: isSelected ? Colors.blue : Colors.white,\n            padding: EdgeInsets.all(16),\n            child: Text(item),\n          ),\n        );\n      }).toList(),\n    );\n  }\n}",
        "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- ListView.builderを使用していないパフォーマンス問題を指摘できているか（すべてのウィジェットが一度に生成される）\n- Columnの代わりにListViewを使うべきことを指摘できているか（スクロール可能性）\n- 不要な再描画を避けるための最適化（const、Key）の提案ができているか\n- InkWellやListTileなどのマテリアルデザインウィジェットの使用を提案できているか\n- 大規模リストでのメモリ使用量の問題を指摘できているか"
      }
    },
    "javascript": {
      "1": {
        "title": "レベル1: 基本的なバグ発見",
        "difficulty": 1,
        "language": "javascript",
        "locale": "ja",
        "requirements": "ユーザーの年齢を検証する関数を実装してください。\n- 年齢は0以上150以下の整数である必要がある\n- 不正な値の場合はエラーを投げる",
        "code": "function validateAge(age) {\n  if (age < 0) {\n    throw new Error('年齢は0以上である必要があります');\n  }\n  return true;\n}",
        "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- 上限チェック（150以下）の欠如を指摘できているか\n- 型チェック（数値型、整数）の欠如を指摘できているか\n- 具体的な改善提案を提示できているか\n- エラーハンドリングの不足を指摘できているか"
      },
      "2": {
        "title": "レベル2: 配列操作のバグ",
        "difficulty": 2,
        "language": "javascript",
        "locale": "ja",
        "requirements": "配列から重複を除去して新しい配列を返す関数を実装してください。\n- 元の配列は変更しない\n- 順序は最初に出現した順を保持する\n- 空配列の場合は空配列を返す\n- nullやundefinedが渡された場合はエラーを投げる",
        "code": "function removeDuplicates(arr) {\n  const result = [];\n  for (let i = 0; i < arr.length; i++) {\n    if (result.indexOf(arr[i]) === -1) {\n      result.push(arr[i]);\n    }\n  }\n  return result;\n}",
        "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- null/undefinedチェックの欠如を指摘できているか\n- 配列以外の値が渡された場合のハンドリングを指摘できているか\n- パフォーマンス改善の提案（Setの使用など）ができているか\n- 元の配列が変更されないことは満たしているが、それを明示的に説明できているか"
      },
      "3": {
        "title": "レベル3: 非同期処理の問題",
        "difficulty": 3,
        "language": "javascript",
        "locale": "ja",
        "requirements": "複数のAPIエンドポイントからデータを取得し、すべてのデータを結合して返す関数を実装してください。\n- すべてのAPIリクエストは並列で実行する\n- 1つでも失敗した場合はエラーを返す\n- タイムアウトは5秒とする\n- 空の配列が渡された場合は空の配列を返す",
        "code": "async function fetchAllData(urls) {\n  const results = [];\n  for (const url of urls) {\n    const response = await fetch(url);\n    const data = await response.json();\n    results.push(data);\n  }\n  return results;\n}",
        "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- 並列実行されていない（Promise.allを使うべき）ことを指摘できているか\n- エラーハンドリング（try-catch）の欠如を指摘できているか\n- タイムアウト処理の欠如を指摘できているか\n- HTTPステータスコードのチェックがないことを指摘できているか\n- 入力バリデーション（空配列、null/undefined）の欠如を指摘できているか"
      }
    },
    "python": {
      "1": {
        "title": "レベル1: リスト処理の基本",
        "difficulty": 1,
        "language": "python",
        "locale": "ja",
        "requirements": "リスト内の偶数のみを抽出して新しいリストを返す関数を実装してください。\n- 元のリストは変更しない\n- 空のリストの場合は空のリストを返す\n- 数値以外の要素が含まれる場合はエラーを発生させる\n- Noneが渡された場合はエラーを発生させる",
        "code": "def filter_even_numbers(numbers):\n    result = []\n    for num in numbers:\n        if num % 2 == 0:\n            result.append(num)\n    return result",
        "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- Noneチェックの欠如を指摘できているか\n- 型チェック（数値以外の要素）の欠如を指摘できているか\n- リスト以外の値が渡された場合のハンドリングを指摘できているか\n- Pythonic な書き方（リスト内包表記）の提案ができているか（ボーナスポイント）"
      },
      "2": {
        "title": "レベル2: 辞書操作の問題",
        "difficulty": 2,
        "language": "python",
        "locale": "ja",
        "requirements": "ユーザー情報の辞書から特定のキーの値を安全に取得する関数を実装してください。\n- キーが存在しない場合はデフォルト値を返す\n- ネストされた辞書にも対応する（例: \"user.profile.name\"）\n- Noneや辞書以外の値が渡された場合はエラーを発生させる\n- キーパスが不正な場合はデフォルト値を返す",
        "code": "def get_nested_value(data, key_path, default=None):\n    keys = key_path.split('.')\n    value = data\n    for key in keys:\n        value = value[key]\n    return value",
        "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- KeyErrorが発生する可能性を指摘できているか\n- try-exceptまたはgetメソッドの使用を提案できているか\n- 型チェック（data が辞書かどうか）の欠如を指摘できているか\n- key_pathの入力バリデーション（空文字列など）の欠如を指摘できているか\n- 途中のキーが辞書でない場合の処理の欠如を指摘できているか"
      },
      "3": {
        "title": "レベル3: クラス設計の問題",
        "difficulty": 3,
        "language": "python",
        "locale": "ja",
        "requirements": "銀行口座を表すクラスを実装してください。\n- 初期残高は0以上でなければならない\n- 預金（deposit）と引き出し（withdraw）メソッドを持つ\n- 残高を超える引き出しはエラーを発生させる\n- 負の金額での預金・引き出しはエラーを発生させる\n- 残高は外部から直接変更できないようにする",
        "code": "class BankAccount:\n    def __init__(self, initial_balance):\n        self.balance = initial_balance\n\n    def deposit(self, amount):\n        self.balance += amount\n        return self.balance\n\n    def withdraw(self, amount):\n        self.balance -= amount\n        return self.balance",
        "evaluationCriteria": "LLMがユーザーのレビューを評価する際の基準：\n- 初期残高の検証（0以上）が欠如していることを指摘できているか\n- 預金額・引き出し額の検証（正の数）が欠如していることを指摘できているか\n- 残高不足チェックが欠如していることを指摘できているか\n- balance属性がpublicであることのセキュリティ問題を指摘できているか（_balanceやプロパティの使用を提案）\n- 型チェック（amountが数値かどうか）の欠如を指摘できているか"
      }
    }
  }
} as const;
export const availableLocales = ["en","ja"] as const;
export const availableLanguages = ["flutter","javascript","python"] as const;
