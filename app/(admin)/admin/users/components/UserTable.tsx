import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";

type StaffUser = {
  id: number;
  username: string;
  role: "admin" | "sales_rep" | "sudo_admin";
  is_active: boolean;
  is_current_user?: boolean;
};

type UserTableProps = {
  title: string;
  users: StaffUser[];
  emptyMessage: string;
  canUpdatePasswordFor: (user: StaffUser) => boolean;
  canDeleteUser: (user: StaffUser) => boolean;
  onPasswordClick: (userId: number, username: string) => void;
  onDeleteClick: (userId: number, username: string) => void;
};

export function UserTable({
  title,
  users,
  emptyMessage,
  canUpdatePasswordFor,
  canDeleteUser,
  onPasswordClick,
  onDeleteClick,
}: UserTableProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {users.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-500">{emptyMessage}</div>
      ) : (
        <>
          <div className="divide-y divide-gray-100 md:hidden">
            {users.map((user) => (
              <div key={user.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 break-words">{user.username}</p>
                    <p className="text-xs text-gray-500">ID: {user.id}</p>
                  </div>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shrink-0">
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {canUpdatePasswordFor(user) || canDeleteUser(user) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {canUpdatePasswordFor(user) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onPasswordClick(user.id, user.username)}
                        className="text-xs"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Password
                      </Button>
                    ) : null}
                    {canDeleteUser(user) ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteClick(user.id, user.username)}
                        className="text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">No actions available</span>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block w-full overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                  <th className="w-20 px-4 py-2 font-medium">ID</th>
                  <th className="w-[32%] px-4 py-2 font-medium">Username</th>
                  <th className="w-28 px-4 py-2 font-medium">Status</th>
                  <th className="w-[44%] px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-2 align-top">{user.id}</td>
                    <td className="px-4 py-2 align-top break-words">{user.username}</td>
                    <td className="px-4 py-2 align-top">{user.is_active ? "Active" : "Inactive"}</td>
                    <td className="px-4 py-2">
                      {canUpdatePasswordFor(user) || canDeleteUser(user) ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {canUpdatePasswordFor(user) ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onPasswordClick(user.id, user.username)}
                              className="text-xs"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" />
                              Password
                            </Button>
                          ) : null}
                          {canDeleteUser(user) ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => onDeleteClick(user.id, user.username)}
                              className="text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
