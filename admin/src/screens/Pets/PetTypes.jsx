import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "@/constant/Urls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const PetTypes = () => {
  const [petTypes, setPetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newPetTypeName, setNewPetTypeName] = useState("");
  const [status, setStatus] = useState(false)
  const [selectedPetType, setSelectedPetType] = useState(null);

  const fetchPetTypes = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/get-pet-type`, {
        params: { page, search }
      });
      setPetTypes(response.data.data || []);
      setTotalPages(Math.ceil(response.data.total / 10));
    } catch (error) {
      console.error("Error fetching pet types:", error);
      setError("Failed to load pet types. Please try again.");
      toast.error("Error fetching pet types!");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePetType = async () => {
    if (!newPetTypeName.trim()) {
      toast.error("Pet type name cannot be empty!");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/create-pet-type`, {
        petType: newPetTypeName
      });
      await fetchPetTypes(currentPage);
      toast.success(response.data.message || "Pet type created successfully!");
      setIsCreateDialogOpen(false);
      setNewPetTypeName("");
      setStatus(false)
    } catch (error) {
      console.error("Error creating pet type:", error);
      toast.error(error.response?.data?.message || "Error creating pet type!");
    }
  };

  const handleUpdatePetType = async () => {
    if (!newPetTypeName.trim()) {
      toast.error("Pet type name cannot be empty!");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/update-pet-type/${selectedPetType._id}`,
        { petType: newPetTypeName, status }
      );
      await fetchPetTypes(currentPage);
      toast.success(response.data.message || "Pet type updated successfully!");
      setIsUpdateDialogOpen(false);
      setNewPetTypeName("");
      setStatus(false)
      setSelectedPetType(null);
    } catch (error) {
      console.error("Error updating pet type:", error);
      toast.error(error.response?.data?.message || "Error updating pet type!");
    }
  };

  const handleDeletePetType = async () => {
    try {
      const response = await axios.delete(
        `${API_URL}/delete-pet-type/${selectedPetType._id}`
      );
      await fetchPetTypes(currentPage);
      toast.success(response.data.message || "Pet type deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedPetType(null);
    } catch (error) {
      console.error("Error deleting pet type:", error);
      toast.error(error.response?.data?.message || "Error deleting pet type!");
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPetTypes(1);
  };

  const openUpdateDialog = (petType) => {
    setSelectedPetType(petType);
    setStatus(petType.status)
    setNewPetTypeName(petType.petType);
    setIsUpdateDialogOpen(true);
  };

  const openDeleteDialog = (petType) => {
    setSelectedPetType(petType);
    setIsDeleteDialogOpen(true);
  };

  useEffect(() => {
    fetchPetTypes(currentPage);
  }, [currentPage]);

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxDisplayedPages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
    let endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);

    if (endPage - startPage + 1 < maxDisplayedPages) {
      startPage = Math.max(1, endPage - maxDisplayedPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Pet Types</CardTitle>
        <CardDescription>
          Manage pet types for your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 mr-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search pet types..."
              value={search}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </form>
          <Button onClick={() => {
            setNewPetTypeName("");
            setIsCreateDialogOpen(true);
          }}>
            Add New Pet Type
          </Button>
        </div>

        {error ? (
          <div className="py-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchPetTypes(currentPage)}
            >
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : petTypes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No pet types found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {petTypes.map((pet) => (
                  <TableRow key={pet._id}>
                    <TableCell className="font-medium">{pet.petType}</TableCell>
                    <TableCell>
                      <Badge variant={pet.status ? "success" : "secondary"}>
                        {pet.status ? "Active" : "Not Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => openUpdateDialog(pet)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(pet)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>

      {/* Create Pet Type Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Pet Type</DialogTitle>
            <DialogDescription>
              Enter the name for the new pet type.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newPetTypeName}
            onChange={(e) => setNewPetTypeName(e.target.value)}
            placeholder="Pet Type Name"
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePetType}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Pet Type Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Pet Type</DialogTitle>
            <DialogDescription>
              Edit the name for this pet type.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newPetTypeName}
            onChange={(e) => setNewPetTypeName(e.target.value)}
            placeholder="Pet Type Name"
            className="mt-2"
          />
         <div className="flex items-center gap-3 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
  <Checkbox
    checked={status}
    onCheckedChange={() => setStatus(!status)}
    className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
  />
  <span className={`text-sm font-medium ${status ? 'text-green-600' : 'text-red-500'}`}>
    {status ? 'Visible to users' : 'Hidden from users'}
  </span>
</div>

  

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePetType}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the pet type "{selectedPetType?.petType}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePetType} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PetTypes;