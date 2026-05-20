import { updateClientDialogStateAction } from "../actions";
import { ClientStateFormControls } from "./client-state-form-controls";
import type { Client, Manager } from "../types";

type ClientStateFormProps = {
  managers: Manager[];
  selectedClient: Client;
};

export function ClientStateForm({
  managers,
  selectedClient,
}: ClientStateFormProps) {
  const assignedManagerId = selectedClient.assignment?.current_manager_id ?? "";
  const selectedManagerId =
    selectedClient.dialog_status === "finished" ? "" : assignedManagerId;
  const formKey = [
    selectedClient.id,
    selectedClient.dialog_status,
    selectedClient.urgency_level,
    selectedManagerId,
  ].join(":");

  return (
    <form
      key={formKey}
      action={updateClientDialogStateAction}
      className="flex flex-wrap items-center gap-1.5"
    >
      <input type="hidden" name="clientId" value={selectedClient.id} />
      <ClientStateFormControls
        initialDialogStatus={selectedClient.dialog_status}
        initialManagerId={selectedManagerId}
        initialUrgencyLevel={selectedClient.urgency_level}
        managers={managers}
      />
      <button
        type="submit"
        className="h-8 rounded-md bg-slate-950 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
      >
        Save
      </button>
    </form>
  );
}
