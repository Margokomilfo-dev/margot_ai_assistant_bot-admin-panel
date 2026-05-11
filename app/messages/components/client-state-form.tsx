import { updateClientDialogStateAction } from "../actions";
import type { Client } from "../types";

type ClientStateFormProps = {
  selectedClient: Client;
};

const dialogStatusOptions = [
  { value: "waiting", label: "Waiting" },
  { value: "in_progress", label: "In progress" },
  { value: "finished", label: "Finished" },
] as const;

const urgencyLevelOptions = [
  { value: "high", label: "High" },
  { value: "middle", label: "Middle" },
  { value: "low", label: "Low" },
] as const;

export function ClientStateForm({ selectedClient }: ClientStateFormProps) {
  return (
    <form
      action={updateClientDialogStateAction}
      className="flex flex-wrap items-center gap-1.5"
    >
      <input type="hidden" name="clientId" value={selectedClient.id} />
      <select
        name="dialogStatus"
        defaultValue={selectedClient.dialog_status}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-slate-950"
      >
        {dialogStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        name="urgencyLevel"
        defaultValue={selectedClient.urgency_level}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-slate-950"
      >
        {urgencyLevelOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-8 rounded-md bg-slate-950 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
      >
        Save
      </button>
    </form>
  );
}
