import { assignClientAction } from "../actions";
import { AssignmentFormControls } from "./assignment-form-controls";
import type { Client, Manager } from "../types";

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
      <AssignmentFormControls
        assignedManagerId={assignedManager?.id ?? ""}
        managers={managers}
      />
    </form>
  );
}
