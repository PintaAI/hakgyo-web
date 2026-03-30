import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserRoles } from "@/lib/prisma-types";
import { UserWithStats, UserFormData } from "./types";

interface UserDialogsProps {
  // Delete Dialog
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  
  // Edit Dialog
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  
  // Bulk Delete Dialog
  bulkDeleteDialogOpen: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  
  // Bulk Update Dialog
  bulkUpdateDialogOpen: boolean;
  setBulkUpdateDialogOpen: (open: boolean) => void;
  
  // Selected User
  selectedUser: UserWithStats | null;
  
  // Bulk selection
  selectedUserIds: Set<string>;
  
  // Form Data
  editFormData: UserFormData;
  setEditFormData: (data: UserFormData) => void;
  
  // Bulk update data
  bulkUpdateData: {
    role?: UserRoles;
    emailVerified?: boolean;
  };
  setBulkUpdateData: (data: {
    role?: UserRoles;
    emailVerified?: boolean;
  }) => void;
  
  // Actions
  onConfirmDelete: () => void;
  onUpdate: () => void;
  onConfirmBulkDelete: () => void;
  onConfirmBulkUpdate: () => void;
}

export function UserDialogs({
  deleteDialogOpen,
  setDeleteDialogOpen,
  editDialogOpen,
  setEditDialogOpen,
  bulkDeleteDialogOpen,
  setBulkDeleteDialogOpen,
  bulkUpdateDialogOpen,
  setBulkUpdateDialogOpen,
  selectedUser,
  selectedUserIds,
  editFormData,
  setEditFormData,
  bulkUpdateData,
  setBulkUpdateData,
  onConfirmDelete,
  onUpdate,
  onConfirmBulkDelete,
  onConfirmBulkUpdate,
}: UserDialogsProps) {
  return (
    <>
      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name || selectedUser?.email}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select 
                value={editFormData.role} 
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value as UserRoles })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="GURU">Teacher</SelectItem>
                  <SelectItem value="MURID">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Delete Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUserIds.size} user(s)? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bulk Update Users</DialogTitle>
            <DialogDescription>
              Update {selectedUserIds.size} selected user(s). Only filled fields will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulk-role" className="text-right">Role</Label>
              <Select 
                value={bulkUpdateData.role || "NO_CHANGE"} 
                onValueChange={(value) => 
                  setBulkUpdateData({ 
                    ...bulkUpdateData, 
                    role: value === "NO_CHANGE" ? undefined : value as UserRoles 
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_CHANGE">No change</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="GURU">Teacher</SelectItem>
                  <SelectItem value="MURID">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email Verified</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="bulk-email-verified"
                  checked={bulkUpdateData.emailVerified === true}
                  onCheckedChange={(checked) => 
                    setBulkUpdateData({ 
                      ...bulkUpdateData, 
                      emailVerified: checked ? true : undefined 
                    })
                  }
                />
                <Label htmlFor="bulk-email-verified" className="text-sm">
                  Set as verified
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={onConfirmBulkUpdate}
              disabled={!bulkUpdateData.role && bulkUpdateData.emailVerified === undefined}
            >
              Update Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
