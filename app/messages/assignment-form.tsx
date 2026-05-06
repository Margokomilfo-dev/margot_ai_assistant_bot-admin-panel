import { assignClientAction } from "./actions";
import type { Client, Manager } from "./types";

type AssignmentFormProps = {
  selectedClient: Client;
  managers: Manager[];
};

// Форма назначения: можно выбрать менеджера или освободить клиента через No manager.
export function AssignmentForm({
  selectedClient,
  managers,
}: AssignmentFormProps) {
  const assignedManager = selectedClient.assignment?.current_manager;

  return (
    <form
      action={assignClientAction}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="clientId" value={selectedClient.id} />
      <label className="sr-only" htmlFor="managerId">
        Assign manager
      </label>
      <select
        id="managerId"
        name="managerId"
        defaultValue={assignedManager?.id ?? ""}
        className="h-9 min-w-56 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-slate-950"
      >
        <option value="">
          No manager
        </option>
        {managers.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.name} {manager.surname} - {manager.position}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-9 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        Save
      </button>
    </form>
  );
}
