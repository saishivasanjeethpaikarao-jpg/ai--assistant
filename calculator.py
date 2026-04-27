"""Simple Python calculator."""

import operator

OPS = {
    "+": operator.add,
    "-": operator.sub,
    "*": operator.mul,
    "/": operator.truediv,
    "%": operator.mod,
    "**": operator.pow,
}


def calculate(expression: str) -> str:
    try:
        tokens = expression.strip().split()
        if len(tokens) != 3:
            return "Usage: <number> <operator> <number>"

        left, op, right = tokens
        left_val = float(left)
        right_val = float(right)
        if op not in OPS:
            return f"Unsupported operator: {op}"

        if op == "/" and right_val == 0:
            return "Error: division by zero."

        result = OPS[op](left_val, right_val)
        if result.is_integer():
            result = int(result)
        return str(result)
    except ValueError:
        return "Please enter numeric values."
    except Exception as exc:
        return f"Calculation error: {exc}"


def main() -> None:
    print("Python Calculator")
    print("Enter expressions like: 3 + 4")
    print("Type quit or exit to stop.")

    while True:
        expression = input("calc> ")
        if expression.lower() in {"quit", "exit"}:
            break
        print(calculate(expression))


if __name__ == "__main__":
    main()
