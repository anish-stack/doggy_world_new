import { API_URL, fetcher } from '@/constant/Urls'
import React, { useState, useEffect, useMemo } from 'react'
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
import axios from 'axios'
import CreateAndEdit from './CreateAndEdit'

const AllDesign = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [filteredData, setFilteredData] = useState([])
  const [paginatedData, setPaginatedData] = useState([])

  // Fetch cake flavors
  const { data, error, mutate } = useSWR(
    `${API_URL}/cake-design`,
    fetcher
  )

  const loading = !data && !error
  const designs = useMemo(() => data?.data || [], [data]);

  useEffect(() => {
    if (!designs.length) return;

    const filtered = search
      ? designs.filter(design =>
        design.name.toLowerCase().includes(search.toLowerCase())
      )
      : designs;

    setFilteredData(filtered);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    setPaginatedData(filtered.slice(startIndex, endIndex));

  }, [designs, search, page, limit]);


  // Calculate pagination info
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / limit);

  // Handle search
  const handleSearch = (e) => {
    setPage(1)
    setSearch(e.target.value)
  }

  // Open create modal
  const handleOpenCreateModal = () => {
    setSelectedDesign(null)
    setIsCreateModalOpen(true)
  }

  // Open edit modal
  const handleOpenEditModal = (design) => {
    setSelectedDesign(design)
    setIsEditModalOpen(true)
  }

  // Open delete dialog
  const handleOpenDeleteDialog = (design) => {
    setSelectedDesign(design)
    setIsDeleteDialogOpen(true)
  }

  // Handle delete designs
  const handleDeleteDesign = async () => {
    try {

      const response = await axios.delete(`${API_URL}/cake-design/${selectedDesign._id}`);

      // Check if the response is successful
      if (response.status === 200) {
        // Refresh the data after deletion
        mutate();
        setIsDeleteDialogOpen(false);
      } else {
        console.error('Failed to delete flavor', response);
        alert('Failed to delete flavor');
      }
    } catch (error) {
      console.error('Error deleting flavor:', error);
      alert('An error occurred while deleting the flavor');
    }
  };

  // Change page
  const handlePageChange = (newPage) => {
    setPage(newPage);
  }

  // Change limit
  const handleLimitChange = (newLimit) => {
    setLimit(parseInt(newLimit));
    setPage(1);
  }

  // Render pagination links
  const renderPaginationLinks = () => {
    const links = []

    // Determine the range of page numbers to display
    let startPage = Math.max(1, page - 2)
    let endPage = Math.min(totalPages, startPage + 4)

    // Adjust the start if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4)
    }

    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={page === i}
            onClick={() => handlePageChange(i)}
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
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">Cake Design</CardTitle>
          <Button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Design
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search Design..."
                value={search}
                onChange={handleSearch}
                className="pl-8"
              />
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-500">Show:</span>
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">Error loading data</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Position</TableHead>
                      <TableHead className="w-16 text-center">Image</TableHead>
                      <TableHead>Design Name</TableHead>
                      <TableHead>Flavor Name</TableHead>
                      <TableHead className="w-24 text-center">Status</TableHead>
                      <TableHead className="w-32 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10">
                          No Cake Design found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((design) => (
                        <TableRow key={design._id}>
                          <TableCell>{design?.position}</TableCell>
                          <TableCell className="text-center">
                            {design.image && (
                              <img
                                src={design.image.url}
                                alt={design.name}
                                className="h-12 w-12 object-cover rounded-md mx-auto"
                              />
                            )}
                          </TableCell>
                          <TableCell>{design.name}</TableCell>
                          <TableCell>{design?.whichFlavoredCake.map((item) => item.name).join(',')}</TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${design.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {design.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal(design)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleOpenDeleteDialog(design)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => page > 1 && handlePageChange(page - 1)}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>

                      {renderPaginationLinks()}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => page < totalPages && handlePageChange(page + 1)}
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <CreateAndEdit
          isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
            setIsEditModalOpen(false)
          }}
          design={selectedDesign}
          onSuccess={() => {
            mutate()
            setIsCreateModalOpen(false)
            setIsEditModalOpen(false)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the flavor "{selectedDesign?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDesign}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AllDesign