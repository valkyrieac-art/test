from dataclasses import dataclass


@dataclass
class Todo:
    title: str
    done: bool = False

    def mark_done(self) -> None:
        self.done = True


def summarize(todos: list[Todo]) -> str:
    completed = sum(todo.done for todo in todos)
    total = len(todos)
    return f"{completed}/{total} tasks completed"


def main() -> None:
    todos = [
        Todo("Write sample Python code"),
        Todo("Run the script"),
        Todo("Review the output"),
    ]

    todos[0].mark_done()
    todos[1].mark_done()

    print("Todo list:")
    for index, todo in enumerate(todos, start=1):
        status = "done" if todo.done else "todo"
        print(f"{index}. [{status}] {todo.title}")

    print()
    print(summarize(todos))


if __name__ == "__main__":
    main()
