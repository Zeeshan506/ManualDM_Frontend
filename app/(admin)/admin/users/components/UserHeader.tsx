import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type UserHeaderProps = {
  userRole?: string;
  onCreateClick: () => void;
};

export function UserHeader({ userRole, onCreateClick }: UserHeaderProps) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">User Directory</h1>
          {userRole === "sudo_admin" ? (
            <span className="rounded-md border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              Sudo Admin View
            </span>
          ) : null}
        </div>
        <Button
          onClick={onCreateClick}
          type="button"
          className="flex w-full items-center justify-center gap-2 sm:mr-6 sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create User
        </Button>
      </div>
      <p className="text-sm text-gray-500 mt-2">Active users grouped by role.</p>
    </div>
  );
}
