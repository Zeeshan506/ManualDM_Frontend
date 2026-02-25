import { Button } from "@/components/ui/button";

type DeleteConfirmModalProps = {
  userId: number | null;
  username: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({
  userId,
  username,
  isSubmitting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium">{username}</span>?
          This action cannot be undone.
        </p>

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
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete User"}
          </Button>
        </div>
      </div>
    </div>
  );
}
