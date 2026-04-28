import { useState, type FormEvent } from "react";
import type { Filter, Todo } from "../types";

type TodoPanelProps = {
  highlighted: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSyncNow: () => void;
  isLoading: boolean;
  isError: boolean;
  todos: Todo[];
  onToggle: (todo: Todo, completed: boolean) => void;
  onTitleChange: (todo: Todo, title: string) => void;
  onDelete: (todo: Todo) => void;
};

export function TodoPanel({
  highlighted,
  onSubmit,
  onSyncNow,
  isLoading,
  isError,
  todos,
  onToggle,
  onTitleChange,
  onDelete,
}: TodoPanelProps) {
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filteredTodos =
    filter === "active"
      ? todos.filter((t) => !t.completed)
      : filter === "completed"
        ? todos.filter((t) => t.completed)
        : todos;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setDraft("");
    onSubmit(event);
  }
  return (
    <section
      id="feature-sync"
      className={`card ${highlighted ? "feature-highlight" : ""}`}
    >
      <form onSubmit={handleSubmit} className="todo-form">
        <label htmlFor="todo-title">New task</label>
        <div>
          <input
            id="todo-title"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ship offline sync flow"
            maxLength={120}
            required
          />
          <button type="submit">Add</button>
        </div>
      </form>

      <div className="filter-row" role="tablist" aria-label="Todo filters">
        {(["all", "active", "completed"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {value}
          </button>
        ))}
        <button type="button" onClick={onSyncNow}>
          Sync now
        </button>
      </div>

      {isLoading ? <p className="muted">Loading todos...</p> : null}
      {isError ? (
        <p className="error">Could not reach server. Showing offline data.</p>
      ) : null}

      <ul className="todo-list">
        {filteredTodos.map((todo) => (
          <li key={todo.id} className={todo.completed ? "done" : ""}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={(event) => onToggle(todo, event.target.checked)}
            />
            <input
              type="text"
              value={todo.title}
              onChange={(event) => onTitleChange(todo, event.target.value)}
              aria-label="Edit todo title"
              maxLength={120}
            />
            <small>{todo.synced ? "synced" : "offline"}</small>
            <button type="button" onClick={() => onDelete(todo)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
