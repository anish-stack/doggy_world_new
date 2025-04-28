import React, { useState } from 'react'
import axios from 'axios'
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
import EditAndCreateModel from './EditAndCreateModel'

// Custom fetcher for SWR with axios
const fetcher = (url) => axios.get(url).then(res => res.data)

const AllCollectionVaccines = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedVaccine, setSelectedVaccine] = useState(null)
  const [searchInput, setSearchInput] = useState('')

  // Fetch vaccines with pagination and search
  const { data, error, mutate } = useSWR(
    `http://localhost:8000/api/v1/list-all-vaccine-types?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`,
    fetcher
  )

  const loading = !data && !error
  const vaccines = data?.data || []
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }

  // Handle search on key change
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    // Debounce search to avoid too many requests
    setTimeout(() => {
      setPage(1)
      setSearch(value)
    }, 500)
  }

  // Open create modal
  const handleOpenCreateModal = () => {
    setSelectedVaccine(null)
    setIsCreateModalOpen(true)
  }

  // Open edit modal
  const handleOpenEditModal = (vaccine) => {
    setSelectedVaccine(vaccine)
    setIsEditModalOpen(true)
  }

  // Open delete dialog
  const handleOpenDeleteDialog = (vaccine) => {
    setSelectedVaccine(vaccine)
    setIsDeleteDialogOpen(true)
  }

  // Handle delete vaccine
  const handleDeleteVaccine = async () => {
    try {
      const response = await axios.delete(`http://localhost:8000/api/v1/remove-vaccine-type/${selectedVaccine._id}`)
      
      if (response.data.success) {
        // Refresh data after deletion
        mutate()
        setIsDeleteDialogOpen(false)
      } else {
        console.error('Failed to delete vaccine')
      }
    } catch (error) {
      console.error('Error deleting vaccine:', error)
    }
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
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Vaccine Collection</CardTitle>
            <CardDescription>Manage your vaccine types here.</CardDescription>
          </div>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Vaccine
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search vaccines..."
                className="pl-8"
                value={searchInput}
                onChange={handleSearchChange}
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

          {loading ? (
            <div className="text-center py-10">Loading vaccines...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">Error loading vaccines</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        No vaccines found
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Sort vaccines by position before rendering
                    [...vaccines].sort((a, b) => a.position - b.position).map((vaccine) => (
                      <TableRow key={vaccine._id}>
                        <TableCell>{vaccine.position}</TableCell>
                        <TableCell>
                          <img 
                            src={vaccine.image?.url || "/api/placeholder/50/50"} 
                            alt={vaccine.title}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{vaccine.title}</TableCell>
                        <TableCell className="max-w-xs truncate">{vaccine.description}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${vaccine.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {vaccine.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(vaccine)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleOpenDeleteDialog(vaccine)}>
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
        <EditAndCreateModel
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
        <EditAndCreateModel
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          vaccine={selectedVaccine}
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
              This will permanently delete the vaccine "{selectedVaccine?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVaccine} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AllCollectionVaccines