import type { ClientDialogStatus, ClientUrgencyLevel } from "../types";

export const dialogStatusOptions = [
  { value: "waiting", label: "Waiting" },
  { value: "in_progress", label: "In progress" },
  { value: "finished", label: "Finished" },
] as const satisfies ReadonlyArray<{
  value: ClientDialogStatus;
  label: string;
}>;

export const urgencyLevelOptions = [
  { value: "high", label: "High" },
  { value: "middle", label: "Middle" },
  { value: "low", label: "Low" },
] as const satisfies ReadonlyArray<{
  value: ClientUrgencyLevel;
  label: string;
}>;
