import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

type CreateUserModalProps = {
  isOpen: boolean;
  username: string;
  password: string;
  role: "admin" | "sales_rep" | "sudo_admin";
  showPassword: boolean;
  isSubmitting: boolean;
  userRole?: string;
  availableRoles: readonly ("admin" | "sales_rep" | "sudo_admin")[];
  onUsernameChange: (username: string) => void;
  onPasswordChange: (password: string) => void;
  onRoleChange: (role: "admin" | "sales_rep" | "sudo_admin") => void;
  onShowPasswordToggle: () => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function CreateUserModal({
  isOpen,
  username,
  password,
  role,
  showPassword,
  isSubmitting,
  userRole,
  availableRoles,
  onUsernameChange,
  onPasswordChange,
  onRoleChange,
  onShowPasswordToggle,
  onCancel,
  onSubmit,
}: CreateUserModalProps) {
  if (!isOpen) return null;

  const getRoleLabel = (r: string) => {
    if (r === "sales_rep") return "Sales Rep";
    if (r === "admin") return "Admin";
    return "Sudo Admin";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900">Create New User</h2>
        <p className="mt-1 text-sm text-gray-600">
          Add a new team member to the system.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-700 block mb-1">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Enter username (min 3 characters)"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="At least 8 characters"
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={onShowPasswordToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="role" className="text-sm font-medium text-gray-700 block mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) =>
                onRoleChange(e.target.value as "admin" | "sales_rep" | "sudo_admin")
              }
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {getRoleLabel(r)}
                </option>
              ))}
            </select>
            {userRole === "admin" && (
              <p className="text-xs text-gray-500 mt-2">
                Admin users can only create Admin and Sales Rep accounts.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </div>
    </div>
  );
}
