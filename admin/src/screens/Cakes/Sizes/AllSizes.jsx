import { API_URL, fetcher } from '@/constant/Urls'
import React, { useState, useEffect } from 'react'
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

const AllSizes = () => {
    // State variables
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [limit, setLimit] = useState(10)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedSize, setSelectedSize] = useState(null)
    const [filteredData, setFilteredData] = useState([])
    const [paginatedData, setPaginatedData] = useState([])
    const [formData, setFormData] = useState({
        price: 0,
        weight: '',
        description: 'Half kg vanilla cake',
        isActive: true,
        position: 1
    })

    // Fetch cake sizes data
    const { data, error, mutate } = useSWR(
        `${API_URL}/cake-sizes`,
        fetcher
    )

    // Process data when it changes
    useEffect(() => {
        if (data?.data) {
            const filtered = data.data.filter(size =>
                size.weight.toLowerCase().includes(search.toLowerCase()) ||
                size.description.toLowerCase().includes(search.toLowerCase())
            )

            setFilteredData(filtered)

            // Calculate pagination
            const startIndex = (page - 1) * limit
            const endIndex = startIndex + limit
            setPaginatedData(filtered.slice(startIndex, endIndex))
        }
    }, [data, search, page, limit])

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        })
    }

    // Handle select changes
    const handleSelectChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value
        })
    }

    // Reset form to default values
    const resetForm = () => {
        setFormData({
            price: 0,
            weight: '',
            description: 'Half kg vanilla cake',
            isActive: true,
            position: data?.data ? data.data.length + 1 : 1
        })
    }

    // Open create modal
    const openCreateModal = () => {
        resetForm()
        setIsCreateModalOpen(true)
    }

    // Open edit modal
    const openEditModal = (size) => {
        setSelectedSize(size)
        setFormData({
            price: size.price,
            weight: size.weight,
            description: size.description,
            isActive: size.isActive,
            position: size.position
        })
        setIsEditModalOpen(true)
    }

    // Open delete confirmation dialog
    const openDeleteDialog = (size) => {
        setSelectedSize(size)
        setIsDeleteDialogOpen(true)
    }

    // Create new size
    const createSize = async () => {
        try {
            await axios.post(`${API_URL}/cake-size`, formData)
            setIsCreateModalOpen(false)
            mutate() // Refresh data
        } catch (error) {
            console.error("Error creating size:", error)
        }
    }

    // Update existing size
    const updateSize = async () => {
        try {
            await axios.put(`${API_URL}/cake-size/${selectedSize._id}`, formData)
            setIsEditModalOpen(false)
            mutate() // Refresh data
        } catch (error) {
            console.error("Error updating size:", error)
        }
    }

    // Delete size
    const deleteSize = async () => {
        try {
            await axios.delete(`${API_URL}/cake-size/${selectedSize._id}`)
            setIsDeleteDialogOpen(false)
            mutate() // Refresh data
        } catch (error) {
            console.error("Error deleting size:", error)
        }
    }

    // Calculate total number of pages
    const totalPages = Math.ceil((filteredData?.length || 0) / limit)

    // Generate pagination links
    const paginationLinks = () => {
        const links = []
        const maxVisiblePages = 5

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages is less than maxVisiblePages
            for (let i = 1; i <= totalPages; i++) {
                links.push(i)
            }
        } else {
            // Show pages with ellipsis
            links.push(1)

            let startPage = Math.max(2, page - 1)
            let endPage = Math.min(page + 1, totalPages - 1)

            if (page <= 3) {
                endPage = 4
            }

            if (page >= totalPages - 2) {
                startPage = totalPages - 3
            }

            if (startPage > 2) {
                links.push('...')
            }

            for (let i = startPage; i <= endPage; i++) {
                links.push(i)
            }

            if (endPage < totalPages - 1) {
                links.push('...')
            }

            links.push(totalPages)
        }

        return links
    }

    // Loading state
    if (!data && !error) {
        return <div className="flex justify-center items-center p-8">Loading cake sizes...</div>
    }

    // Error state
    if (error) {
        return <div className="text-red-500 p-8">Error loading cake sizes data</div>
    }

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Cake Sizes</CardTitle>
                    <Button onClick={openCreateModal} className="flex items-center gap-1">
                        <Plus className="h-4 w-4" /> Add New Size
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search sizes..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Show</span>
                            <Select
                                value={limit.toString()}
                                onValueChange={(value) => setLimit(Number(value))}
                            >
                                <SelectTrigger className="w-16">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-gray-500">entries</span>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Position</TableHead>
                                    <TableHead>Weight</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-24">Price</TableHead>
                                    <TableHead className="w-24">Status</TableHead>
                                    <TableHead className="w-32 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((size) => (
                                        <TableRow key={size._id}>
                                            <TableCell>{size.position}</TableCell>
                                            <TableCell>{size.weight}</TableCell>
                                            <TableCell>{size.description}</TableCell>
                                            <TableCell>₹{size.price}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs ${size.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {size.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => openEditModal(size)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="text-red-600"
                                                        onClick={() => openDeleteDialog(size)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No sizes found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {paginatedData.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, filteredData.length)} of {filteredData.length} entries
                        </div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {paginationLinks().map((link, index) => (
                                    <PaginationItem key={index}>
                                        {link === '...' ? (
                                            <span className="px-2">...</span>
                                        ) : (
                                            <PaginationLink
                                                isActive={page === link}
                                                onClick={() => setPage(link)}
                                            >
                                                {link}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                        className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </CardContent>
            </Card>

            {/* Create Modal */}
            <AlertDialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add New Cake Size</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter the details for the new cake size.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="weight" className="text-right text-sm">
                                Weight
                            </label>
                            <Input
                                id="weight"
                                name="weight"
                                value={formData.weight}
                                onChange={handleInputChange}
                                placeholder="e.g. 500g"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="description" className="text-right text-sm">
                                Description
                            </label>
                            <Input
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Description"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="price" className="text-right text-sm">
                                Price (₹)
                            </label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="Price"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="position" className="text-right text-sm">
                                Position
                            </label>
                            <Input
                                id="position"
                                name="position"
                                type="number"
                                value={formData.position}
                                onChange={handleInputChange}
                                placeholder="Position"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="isActive" className="text-right text-sm">
                                Status
                            </label>
                            <Select
                                value={formData.isActive.toString()}
                                onValueChange={(value) => handleSelectChange('isActive', value === 'true')}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={createSize}>Create</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Modal */}
            <AlertDialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Edit Cake Size</AlertDialogTitle>
                        <AlertDialogDescription>
                            Update the details for this cake size.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-weight" className="text-right text-sm">
                                Weight
                            </label>
                            <Input
                                id="edit-weight"
                                name="weight"
                                value={formData.weight}
                                onChange={handleInputChange}
                                placeholder="e.g. 500g"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-description" className="text-right text-sm">
                                Description
                            </label>
                            <Input
                                id="edit-description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Description"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-price" className="text-right text-sm">
                                Price (₹)
                            </label>
                            <Input
                                id="edit-price"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="Price"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-position" className="text-right text-sm">
                                Position
                            </label>
                            <Input
                                id="edit-position"
                                name="position"
                                type="number"
                                value={formData.position}
                                onChange={handleInputChange}
                                placeholder="Position"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="edit-isActive" className="text-right text-sm">
                                Status
                            </label>
                            <Select
                                value={formData.isActive.toString()}
                                onValueChange={(value) => handleSelectChange('isActive', value === 'true')}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={updateSize}>Update</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the cake size "{selectedSize?.weight} - {selectedSize?.description}"?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteSize} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default AllSizes