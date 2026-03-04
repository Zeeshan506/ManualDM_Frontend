"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { UserHeader } from "./components/UserHeader";
import { UserTable } from "./components/UserTable";
import { PasswordModal } from "./components/PasswordModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { CreateUserModal } from "./components/CreateUserModal";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

type StaffUser = {
  id: number;
  username: string;
  role: "admin" | "sales_rep" | "sudo_admin";
  is_active: boolean;
  is_current_user?: boolean;
};

type PasswordModalState = {
  userId: number | null;
  username: string;
  password: string;
  showPassword: boolean;
  isSubmitting: boolean;
};

type DeleteConfirmState = {
  userId: number | null;
  username: string;
  isSubmitting: boolean;
};

type CreateUserModalState = {
  isOpen: boolean;
  username: string;
  password: string;
  role: "admin" | "sales_rep" | "sudo_admin";
  showPassword: boolean;
  isSubmitting: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = Number(user?.userId);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<PasswordModalState>({
    userId: null,
    username: "",
    password: "",
    showPassword: false,
    isSubmitting: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    userId: null,
    username: "",
    isSubmitting: false,
  });
  const [createUserModal, setCreateUserModal] = useState<CreateUserModalState>({
    isOpen: false,
    username: "",
    password: "",
    role: "sales_rep",
    showPassword: false,
    isSubmitting: false,
  });

  const fetchUsers = useCallback(async () => {
    if (!user?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/sudo/users?active_only=true`, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail || "Failed to load users");
      }

      const data = (await response.json()) as StaffUser[];
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [user?.accessToken]);

  useEffect(() => {
    if (user?.role === "sales_rep") {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;

    if (!cancelled) {
      fetchUsers();
    }

    return () => {
      cancelled = true;
    };
  }, [fetchUsers, user?.role, router]);

  const handleOpenPasswordModal = (userId: number, username: string) => {
    setPasswordModal({
      userId,
      username,
      password: "",
      showPassword: false,
      isSubmitting: false,
    });
  };

  const handleClosePasswordModal = () => {
    setPasswordModal({
      userId: null,
      username: "",
      password: "",
      showPassword: false,
      isSubmitting: false,
    });
  };

  const handleSubmitPassword = async () => {
    if (!passwordModal.userId || !passwordModal.password.trim()) {
      toast.error("Password is required");
      return;
    }

    const target = staff.find((item) => item.id === passwordModal.userId);
    if (!target) {
      toast.error("User not found");
      return;
    }

    const canUpdatePassword =
      user?.role === "sudo_admin"
        ? target.id === currentUserId || target.role !== "sudo_admin"
        : user?.role === "admin"
          ? target.id === currentUserId || target.role === "sales_rep"
          : false;

    if (!canUpdatePassword) {
      toast.error("You do not have permission to update this user password");
      return;
    }

    if (passwordModal.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setPasswordModal((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch(
        `${API_URL}/api/sudo/users/${passwordModal.userId}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.accessToken}`,
          },
          body: JSON.stringify({ password: passwordModal.password }),
        }
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail || "Failed to update password");
      }

      toast.success(`Password updated for ${passwordModal.username}`);
      handleClosePasswordModal();
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleOpenDeleteConfirm = (userId: number, username: string) => {
    setDeleteConfirm({
      userId,
      username,
      isSubmitting: false,
    });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirm({
      userId: null,
      username: "",
      isSubmitting: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.userId) return;

    const target = staff.find((item) => item.id === deleteConfirm.userId);
    if (!target) {
      toast.error("User not found");
      return;
    }

    const canDelete =
      user?.role === "sudo_admin"
        ? target.role !== "sudo_admin" && target.id !== currentUserId
        : user?.role === "admin"
          ? target.role === "sales_rep" && target.id !== currentUserId
          : false;

    if (!canDelete) {
      toast.error("You do not have permission to delete this user");
      return;
    }

    setDeleteConfirm((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch(`${API_URL}/api/sudo/users/${deleteConfirm.userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail || "Failed to delete user");
      }

      toast.success(`User ${deleteConfirm.username} deleted`);
      handleCloseDeleteConfirm();
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleteConfirm((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const admins = useMemo(() => staff.filter((item) => item.role === "admin"), [staff]);
  const sudoAdmins = useMemo(() => staff.filter((item) => item.role === "sudo_admin"), [staff]);
  const salesReps = useMemo(() => staff.filter((item) => item.role === "sales_rep"), [staff]);

  const canUpdatePasswordFor = (target: StaffUser) => {
    if (!user) return false;
    if (user.role === "sudo_admin") return target.id === currentUserId || target.role !== "sudo_admin";
    if (user.role === "admin") return target.id === currentUserId || target.role === "sales_rep";
    return false;
  };

  const canDeleteUser = (target: StaffUser) => {
    if (!user) return false;
    if (target.id === currentUserId) return false;
    if (user.role === "sudo_admin") return target.role !== "sudo_admin";
    if (user.role === "admin") return target.role === "sales_rep";
    return false;
  };

  const handleOpenCreateUserModal = () => {
    setCreateUserModal({
      isOpen: true,
      username: "",
      password: "",
      role: "sales_rep",
      showPassword: false,
      isSubmitting: false,
    });
  };

  const handleCloseCreateUserModal = () => {
    setCreateUserModal({
      isOpen: false,
      username: "",
      password: "",
      role: "sales_rep",
      showPassword: false,
      isSubmitting: false,
    });
  };

  const handleSubmitCreateUser = async () => {
    if (!createUserModal.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (createUserModal.username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (!createUserModal.password.trim()) {
      toast.error("Password is required");
      return;
    }

    if (createUserModal.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    // Check role permissions
    const canCreateRole =
      user?.role === "sudo_admin"
        ? true
        : user?.role === "admin"
          ? createUserModal.role !== "sudo_admin"
          : false;

    if (!canCreateRole) {
      toast.error("You do not have permission to create a user with this role");
      return;
    }

    setCreateUserModal((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch(`${API_URL}/api/sudo/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.accessToken}`,
        },
        body: JSON.stringify({
          username: createUserModal.username.trim(),
          password: createUserModal.password,
          role: createUserModal.role,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail || "Failed to create user");
      }

      toast.success(`User ${createUserModal.username} created successfully`);
      handleCloseCreateUserModal();
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreateUserModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const getAvailableRoles = () => {
    if (user?.role === "sudo_admin") {
      return ["admin", "sales_rep", "sudo_admin"] as const;
    } else if (user?.role === "admin") {
      return ["admin", "sales_rep"] as const;
    }
    return [] as const;
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading users...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>;
  }

  if (user?.role === "sales_rep") {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      <UserHeader userRole={user?.role} onCreateClick={handleOpenCreateUserModal} />

      <UserTable
        title="Sudo Admins"
        users={sudoAdmins}
        emptyMessage="No active sudo admins."
        canUpdatePasswordFor={canUpdatePasswordFor}
        canDeleteUser={canDeleteUser}
        onPasswordClick={handleOpenPasswordModal}
        onDeleteClick={handleOpenDeleteConfirm}
      />

      <UserTable
        title="Admins"
        users={admins}
        emptyMessage="No active admins."
        canUpdatePasswordFor={canUpdatePasswordFor}
        canDeleteUser={canDeleteUser}
        onPasswordClick={handleOpenPasswordModal}
        onDeleteClick={handleOpenDeleteConfirm}
      />

      <UserTable
        title="Sales Reps"
        users={salesReps}
        emptyMessage="No active sales reps."
        canUpdatePasswordFor={canUpdatePasswordFor}
        canDeleteUser={canDeleteUser}
        onPasswordClick={handleOpenPasswordModal}
        onDeleteClick={handleOpenDeleteConfirm}
      />

      <PasswordModal
        userId={passwordModal.userId}
        username={passwordModal.username}
        isOpen={Boolean(passwordModal.userId)}
        isSubmitting={passwordModal.isSubmitting}
        password={passwordModal.password}
        showPassword={passwordModal.showPassword}
        onPasswordChange={(password) =>
          setPasswordModal((prev) => ({ ...prev, password }))
        }
        onShowPasswordToggle={() =>
          setPasswordModal((prev) => ({
            ...prev,
            showPassword: !prev.showPassword,
          }))
        }
        onCancel={handleClosePasswordModal}
        onSubmit={handleSubmitPassword}
      />

      <DeleteConfirmModal
        userId={deleteConfirm.userId}
        username={deleteConfirm.username}
        isSubmitting={deleteConfirm.isSubmitting}
        onCancel={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
      />

      <CreateUserModal
        isOpen={createUserModal.isOpen}
        username={createUserModal.username}
        password={createUserModal.password}
        role={createUserModal.role}
        showPassword={createUserModal.showPassword}
        isSubmitting={createUserModal.isSubmitting}
        userRole={user?.role}
        availableRoles={getAvailableRoles()}
        onUsernameChange={(username) =>
          setCreateUserModal((prev) => ({ ...prev, username }))
        }
        onPasswordChange={(password) =>
          setCreateUserModal((prev) => ({ ...prev, password }))
        }
        onRoleChange={(role) =>
          setCreateUserModal((prev) => ({ ...prev, role }))
        }
        onShowPasswordToggle={() =>
          setCreateUserModal((prev) => ({
            ...prev,
            showPassword: !prev.showPassword,
          }))
        }
        onCancel={handleCloseCreateUserModal}
        onSubmit={handleSubmitCreateUser}
      />
    </div>
  );
}
