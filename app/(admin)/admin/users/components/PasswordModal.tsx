import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

type PasswordModalProps = {
  userId: number | null;
  username: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onPasswordChange: (password: string) => void;
  onShowPasswordToggle: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  password: string;
  showPassword: boolean;
};

export function PasswordModal({
  userId,
  username,
  isOpen,
  isSubmitting,
  password,
  showPassword,
  onPasswordChange,
  onShowPasswordToggle,
  onCancel,
  onSubmit,
}: PasswordModalProps) {
  if (!isOpen || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg border border-border">
        <h2 className="text-lg font-semibold text-card-foreground">Edit Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update password for <span className="font-medium">{username}</span>
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="pwd" className="text-sm font-medium text-foreground block mb-1">
              New Password
            </label>
            <div className="relative">
              <Input
                id="pwd"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
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
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
