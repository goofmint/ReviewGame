---
title: "Level 3: Class Design Issues"
difficulty: 3
language: python
locale: en
---

# Requirements

Implement a class representing a bank account.
- Initial balance must be 0 or greater
- Must have deposit and withdraw methods
- Withdrawals exceeding the balance should raise an error
- Deposits and withdrawals with negative amounts should raise an error
- Balance should not be directly modifiable from outside

# Code

```python
class BankAccount:
    def __init__(self, initial_balance):
        self.balance = initial_balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def withdraw(self, amount):
        self.balance -= amount
        return self.balance
```

# Evaluation Criteria

Criteria for LLM to evaluate user's review:
- Can identify missing validation for initial balance (0 or greater)
- Can identify missing validation for deposit/withdrawal amounts (positive numbers)
- Can identify missing insufficient balance check
- Can identify security issues with public balance attribute (suggest using _balance or property)
- Can identify missing type check (whether amount is numeric)
