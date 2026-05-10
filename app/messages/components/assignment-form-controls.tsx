"use client";

import { useFormStatus } from "react-dom";

import type { Manager } from "../types";

type AssignmentFormControlsProps = {
  assignedManagerId: string;
  managers: Manager[];
};

export function AssignmentFormControls({
  assignedManagerId,
  managers,
}: AssignmentFormControlsProps) {
  const { pending } = useFormStatus();

  return (
    <>
      <label className="sr-only" htmlFor="managerId">
        Assign manager
      </label>
      <select
        id="managerId"
        name="managerId"
        defaultValue={assignedManagerId}
        disabled={pending}
        className="h-9 min-w-56 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">No manager</option>
        {managers.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.name} {manager.surname} - {manager.position}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="h-9 min-w-20 cursor-pointer rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </>
  );
}
