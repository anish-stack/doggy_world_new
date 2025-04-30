import { API_URL, fetcher } from '@/constant/Urls'
import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { toast } from "sonner"
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
import { Search, Plus, Edit, Trash2, Loader2, ImageIcon, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import CreateAndEditModelForPetShop from './CreateAndEditModelForPetShop'

const PetShopCategories = () => {
  // State management
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch categories with SWR
  const { data, error, mutate, isValidating } = useSWR(
    `${API_URL}/petshop-category?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`,
    fetcher
  )

  const loading = !data && !error
  const categories = data?.data || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Handle search with debounce
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setPage(1)
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
      setIsDeleting(true)
      // Send the delete request to the server
      const response = await axios.delete(`${API_URL}/petshop-category/${selectedCategory._id}`)
      
      if (response.status === 200) {
        toast.success('Category deleted successfully')
        // Refresh the data after deletion
        mutate()
        setIsDeleteDialogOpen(false)
      } else {
        console.error('Failed to delete category', response)
        toast.error('Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error(error.response?.data?.message || 'An error occurred while deleting the category')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle successful create/edit
  const handleSuccess = () => {
    mutate()
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
  }

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
    <div className="container mx-auto py-6 px-4">
      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Pet Shop Categories</CardTitle>
            <CardDescription>Manage your pet shop categories</CardDescription>
          </div>
          <Button onClick={handleOpenCreateModal} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add New Category
          </Button>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            
            <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
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
          
          {/* Categories Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>Error loading categories. Please try again.</p>
              <Button variant="outline" className="mt-4" onClick={() => mutate()}>
                Retry
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No categories found</p>
              {search && (
                <Button variant="outline" className="mt-4" onClick={() => setSearch('')}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Background Color</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell>
                        {category.imageUrl?.url ? (
                          <div className="h-12 w-12 rounded-md overflow-hidden">
                            <img
                              src={category.imageUrl.url || "/placeholder.svg"}
                              alt={category.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{category.title}</TableCell>
                      <TableCell>{category.position}</TableCell>
                      <TableCell>
                        {category.backgroundColour ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-6 w-6 rounded-full border" 
                              style={{ backgroundColor: category.backgroundColour }}
                            />
                            <span>{category.backgroundColour}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Default</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {category.active ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleOpenEditModal(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => handleOpenDeleteDialog(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} categories
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1 || isValidating}
                    />
                  </PaginationItem>
                  
                  {renderPaginationLinks()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                      disabled={page === pagination.totalPages || isValidating}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateAndEditModelForPetShop
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && selectedCategory && (
        <CreateAndEditModelForPetShop
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleSuccess}
          category={selectedCategory}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{selectedCategory?.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDeleteCategory()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PetShopCategories
