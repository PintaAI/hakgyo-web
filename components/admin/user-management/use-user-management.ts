import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { UserRoles } from "@/app/generated/prisma/client";
import { 
  getAllUsers, 
  updateUser, 
  deleteUser, 
  toggleUserEmailVerification,
  bulkUpdateUsers,
  bulkDeleteUsers,
  getUserStats,
} from "@/app/actions/dashboard/admin";
import { UserWithStats, UserFormData, UserManagementData, DatabaseUserStats } from "./types";

export function useUserManagement(initialData: UserManagementData) {
  const [users, setUsers] = useState<UserWithStats[]>(initialData.users);
  const [currentPage, setCurrentPage] = useState(initialData.currentPage);
  const [hasNextPage, setHasNextPage] = useState(initialData.hasNextPage);
  const [databaseStats, setDatabaseStats] = useState<DatabaseUserStats>(initialData.databaseStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRoles | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Sorting
  type SortField = "name" | "email" | "role" | "level" | "xp" | "createdAt";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [editFormData, setEditFormData] = useState<UserFormData>({
    name: "",
    email: "",
    role: "MURID" as UserRoles,
  });

  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkUpdateData, setBulkUpdateData] = useState<{
    role?: UserRoles;
    emailVerified?: boolean;
  }>({});

  // Ref for scroll detection
  const tableRef = useRef<HTMLDivElement>(null);

  // Load database stats
  const loadDatabaseStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const stats = await getUserStats();
      setDatabaseStats(stats);
    } catch (err) {
      toast.error("Failed to load user statistics");
      console.error("Error loading database stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Load users (replace current list)
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const usersData = await getAllUsers({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        page: 1,
        limit: 20,
      });
      setUsers(usersData.users);
      setCurrentPage(usersData.currentPage);
      setHasNextPage(usersData.hasNextPage);
    } catch (err) {
      toast.error("Failed to load users");
      console.error("Error loading users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter]);

  // Refresh all data (users + stats)
  const refreshData = useCallback(async () => {
    await Promise.all([loadUsers(), loadDatabaseStats()]);
  }, [loadUsers, loadDatabaseStats]);

  // Load more users (append to current list)
  const loadMoreUsers = useCallback(async () => {
    if (isLoadingMore || !hasNextPage) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const usersData = await getAllUsers({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        page: nextPage,
        limit: 20,
      });
      
      setUsers(prevUsers => [...prevUsers, ...usersData.users]);
      setCurrentPage(usersData.currentPage);
      setHasNextPage(usersData.hasNextPage);
    } catch (err) {
      toast.error("Failed to load more users");
      console.error("Error loading more users:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasNextPage, isLoadingMore, searchTerm, roleFilter, statusFilter]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!tableRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (nearBottom && hasNextPage && !isLoadingMore) {
      loadMoreUsers();
    }
  }, [hasNextPage, isLoadingMore, loadMoreUsers]);

  // Event handlers
  const handleEdit = (user: UserWithStats) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email,
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (user: UserWithStats) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleToggleEmail = async (user: UserWithStats) => {
    try {
      await toggleUserEmailVerification(user.id);
      toast.success(`Email verification ${user.emailVerified ? 'disabled' : 'enabled'}`);
      loadUsers();
    } catch {
      toast.error("Failed to toggle email verification");
    }
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      try {
        await deleteUser(selectedUser.id);
        toast.success("User deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        refreshData(); // Refresh both users and stats
      } catch {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleUpdate = async () => {
    if (selectedUser) {
      try {
        await updateUser(selectedUser.id, editFormData);
        toast.success("User updated successfully");
        setEditDialogOpen(false);
        setSelectedUser(null);
        refreshData(); // Refresh both users and stats
      } catch {
        toast.error("Failed to update user");
      }
    }
  };

  // Bulk selection handlers
  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(users.map(user => user.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  // Bulk operation handlers
  const handleBulkDelete = () => {
    if (selectedUserIds.size === 0) {
      toast.error("No users selected");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteUsers(Array.from(selectedUserIds));
      toast.success(`Successfully deleted ${selectedUserIds.size} users`);
      setBulkDeleteDialogOpen(false);
      clearSelection();
      refreshData(); // Refresh both users and stats
    } catch {
      toast.error("Failed to delete users");
    }
  };

  const handleBulkUpdate = () => {
    if (selectedUserIds.size === 0) {
      toast.error("No users selected");
      return;
    }
    setBulkUpdateDialogOpen(true);
  };

  const confirmBulkUpdate = async () => {
    try {
      await bulkUpdateUsers(Array.from(selectedUserIds), bulkUpdateData);
      toast.success(`Successfully updated ${selectedUserIds.size} users`);
      setBulkUpdateDialogOpen(false);
      clearSelection();
      setBulkUpdateData({});
      refreshData(); // Refresh both users and stats
    } catch {
      toast.error("Failed to update users");
    }
  };

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with asc direction
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Effects
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshData();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [refreshData]);

  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('scroll', handleScroll);
      return () => tableElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return {
    // Data
    users,
    databaseStats,
    isLoading,
    isLoadingMore,
    isLoadingStats,
    
    // Filters
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    
    // Sorting
    sortField,
    sortDirection,
    handleSort,
    
    // Dialog states
    deleteDialogOpen,
    setDeleteDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    bulkUpdateDialogOpen,
    setBulkUpdateDialogOpen,
    selectedUser,
    editFormData,
    setEditFormData,
    
    // Bulk selection state
    selectedUserIds,
    bulkUpdateData,
    setBulkUpdateData,
    
    // Actions
    refreshData,
    handleEdit,
    handleDelete,
    handleToggleEmail,
    confirmDelete,
    handleUpdate,
    
    // Bulk selection actions
    handleSelectUser,
    handleSelectAll,
    clearSelection,
    
    // Bulk operation actions
    handleBulkDelete,
    confirmBulkDelete,
    handleBulkUpdate,
    confirmBulkUpdate,
    
    // Refs
    tableRef,
  };
}
