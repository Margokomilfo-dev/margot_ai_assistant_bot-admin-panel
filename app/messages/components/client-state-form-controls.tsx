"use client";

import { useState } from "react";

import { dialogStatusOptions, urgencyLevelOptions } from "../lib/client-options";
import type { ClientDialogStatus, ClientUrgencyLevel, Manager } from "../types";

type ClientStateFormControlsProps = {
  initialDialogStatus: ClientDialogStatus;
  initialManagerId: string;
  initialUrgencyLevel: ClientUrgencyLevel;
  managers: Manager[];
};

export function ClientStateFormControls({
  initialDialogStatus,
  initialManagerId,
  initialUrgencyLevel,
  managers,
}: ClientStateFormControlsProps) {
  const [dialogStatus, setDialogStatus] =
    useState<ClientDialogStatus>(initialDialogStatus);

  return (
    <>
      <select
        name="dialogStatus"
        value={dialogStatus}
        onChange={(event) =>
          setDialogStatus(event.target.value as ClientDialogStatus)
        }
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
        defaultValue={initialUrgencyLevel}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-slate-950"
      >
        {urgencyLevelOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        name="managerId"
        defaultValue={initialManagerId}
        onChange={(event) => {
          if (event.target.value) {
            setDialogStatus("in_progress");
          }
        }}
        className="h-8 min-w-48 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-slate-950"
      >
        <option value="">No manager</option>
        {managers.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.name} {manager.surname}
          </option>
        ))}
      </select>
    </>
  );
}
