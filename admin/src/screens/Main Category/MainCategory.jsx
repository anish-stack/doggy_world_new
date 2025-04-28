import { API_URL, fetcher } from '@/constant/Urls'
import React, { useState } from 'react'
import useSWR from 'swr'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Plus, Edit, Trash2 } from 'lucide-react'
import CreateAndEditCategoryModal from './CreateAndEditCategoryModal'
import axios from 'axios'

const MainCategory = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Fetch categories with pagination and search
  const { data, error, mutate } = useSWR(
    `${API_URL}/get-main-pet-category?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`,
    fetcher
  )

  const loading = !data && !error
  const categories = data?.data || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Handle search
  const handleSearch = (e) => {

    setPage(1)
    setSearch(e.target.value)

  }

  // Open create modal
  const handleOpenCreateModal = () => {
    setSelectedCategory(null)
    setIsCreateModalOpen(true)
  }

  // Open edit modal
  const handleOpenEditModal = (category) => {
    setSelectedCategory(category)
    setIsEditModalOpen(true)
  }

  // Open delete dialog
  const handleOpenDeleteDialog = (category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  // Handle delete category
  const handleDeleteCategory = async () => {
    try {
      // Send the delete request to the server
      const response = await axios.delete(`${API_URL}/delete-pet-category/${selectedCategory._id}`);

      // Check if the response is successful
      if (response.status === 200) {
        // Optionally show a success message
        alert('Category deleted successfully');
        // Refresh the data after deletion (you might use SWR, React Query, or state update here)
        mutate();
        setIsDeleteDialogOpen(false);
      } else {
        // In case of failure, log error and show alert
        console.error('Failed to delete category', response);
        alert('Failed to delete category');
      }
    } catch (error) {
      // Catch any errors that occur during the delete request
      console.error('Error deleting category:', error);
      alert('An error occurred while deleting the category');
    }
  };


  // Render pagination links
  const renderPaginationLinks = () => {
    const links = []
    const { totalPages, page: currentPage } = pagination

    // Determine the range of page numbers to display
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, startPage + 4)

    // Adjust the start if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4)
    }

    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return links
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pet Categories</CardTitle>
            <CardDescription>Manage your pet categories here.</CardDescription>
          </div>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search categories..."
                className="pl-8"
                onChange={handleSearch}
                value={search}
              />

            </div>
            <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>

          </div>

          {loading ? (
            <div className="text-center py-10">Loading categories...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">Error loading categories</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Sort categories by position before rendering
                    [...categories].sort((a, b) => a.position - b.position).map((category) => (
                      <TableRow key={category._id}>
                        <TableCell>{category.position}</TableCell>
                        <TableCell>
                          <img
                            src={category.image?.url || "/api/placeholder/50/50"}
                            alt={category.title}
                            className="h-12 w-12 bg-white rounded-md object-cover"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{category.title}</TableCell>
                        <TableCell>{category.route}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleOpenDeleteDialog(category)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {renderPaginationLinks()}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                        className={page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateAndEditCategoryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            mutate()
          }}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <CreateAndEditCategoryModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          category={selectedCategory}
          onSuccess={() => {
            setIsEditModalOpen(false)
            mutate()
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{selectedCategory?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MainCategory