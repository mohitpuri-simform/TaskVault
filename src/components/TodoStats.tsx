import type { Todo } from "../types";

type TodoStatsProps = {
  todos: Todo[];
};

export function TodoStats({ todos }: TodoStatsProps) {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;
  const active = total - completed;

  return (
    <section className="stats-card" aria-label="Todo summary">
      <h2>Quick Stats</h2>
      <div className="stats-grid">
        <p>
          <span>{total}</span>
          Total
        </p>
        <p>
          <span>{active}</span>
          Active
        </p>
        <p>
          <span>{completed}</span>
          Completed
        </p>
      </div>
    </section>
  );
}
