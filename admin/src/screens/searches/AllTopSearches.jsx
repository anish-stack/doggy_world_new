"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { Search, Trash2, Edit, ChevronLeft, ChevronRight, Plus } from "lucide-react"

// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"

import { API_URL } from "@/constant/Urls"

const AllTopSearches = () => {
    const [searches, setSearches] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [currentSearch, setCurrentSearch] = useState({
        searchTerm: "",
        id: "",
        position: 1,
        route: "",
        active: true
    })
    const [filteredSearches, setFilteredSearches] = useState([])
    const itemsPerPage = 10

    // Fetch all searches on component mount
    useEffect(() => {
        fetchSearches()
    }, [currentPage])

    // Filter searches when searchTerm changes
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredSearches(searches)
        } else {
            const filtered = searches.filter(search =>
                search.searchTerm.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredSearches(filtered)
        }
    }, [searchTerm, searches])

    // Fetch all searches from the API
    const fetchSearches = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${API_URL}/top-search/all`, {
                params: {
                    page: currentPage,
                    limit: itemsPerPage
                }
            })

            setSearches(response.data.data || [])
            setFilteredSearches(response.data.data || [])

            // Calculate total pages if pagination info is available
            if (response.data.totalCount) {
                setTotalPages(Math.ceil(response.data.totalCount / itemsPerPage))
            }

            setLoading(false)
        } catch (error) {
            console.error("Error fetching searches:", error)
            toast.error(error.response.data.message || "Failed to fetch searches")
            setLoading(false)
        }
    }

    // Handle creating a new search
    const handleCreateSearch = async () => {
        if (!currentSearch.searchTerm.trim()) {
            toast.error("Search term is required")
            return
        }

        setLoading(true)
        try {
            if (isEditMode) {
                // Update existing search
                await axios.put(`${API_URL}/top-search/update/${currentSearch._id}`, currentSearch)
                toast.success("Search updated successfully")
            } else {
                // Create new search
                await axios.post(`${API_URL}/top-search/create`, currentSearch)
                toast.success("Search created successfully")
            }

            // Reset form and refetch data
            setIsModalOpen(false)
            setCurrentSearch({ searchTerm: "", position: 1, active: true })
            setIsEditMode(false)
            fetchSearches()
        } catch (error) {
            console.error("Error saving search:", error)
            toast.error(isEditMode ? error.response.data.message || "Failed to update search" : error.response.data.message || "Failed to create search")
        } finally {
            setLoading(false)
        }
    }

    // Handle editing a search
    const handleEdit = (search) => {
        setCurrentSearch({ ...search })
        setIsEditMode(true)
        setIsModalOpen(true)
    }

    // Handle deleting a search
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this search?")) {
            setLoading(true)
            try {
                await axios.delete(`${API_URL}/top-search/delete/${id}`)
                toast.success("Search deleted successfully")
                fetchSearches()
            } catch (error) {
                console.error("Error deleting search:", error)
                toast.error(error.response.data.message)
            } finally {
                setLoading(false)
            }
        }
    }

    // Toggle search status (active/inactive)
    const toggleStatus = async (id, currentStatus) => {
        setLoading(true)
        try {
            await axios.patch(`${API_URL}/top-search/toggle-status/${id}`)
            toast.success(`Search ${currentStatus ? 'deactivated' : 'activated'} successfully`)
            fetchSearches()
        } catch (error) {
            console.error("Error toggling status:", error)
            toast.error(error.response.data.message)
        } finally {
            setLoading(false)
        }
    }

    // Handle pagination
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1)
        }
    }

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1)
        }
    }

    // Open modal for creating a new search
    const openCreateModal = () => {
        setCurrentSearch({ searchTerm: "", position: 1, active: true })
        setIsEditMode(false)
        setIsModalOpen(true)
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-bold">Top Searches</CardTitle>
                    <Button onClick={openCreateModal} className="flex items-center gap-2">
                        <Plus size={16} />
                        Add New Search
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                className="pl-10"
                                placeholder="Search by term..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredSearches.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No searches found. Add a new search to get started.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Search Term</TableHead>
                                            <TableHead>Position</TableHead>
                                            <TableHead>Route</TableHead>
                                            <TableHead>Product Id</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead>Updated At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSearches.map((search) => (
                                            <TableRow key={search._id}>
                                                <TableCell className="font-medium">{search.searchTerm}</TableCell>
                                                <TableCell>{search.position}</TableCell>
                                                <TableCell>{search.route || 'N/A'}</TableCell>
                                                <TableCell>{search.id || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge className={search.active ? "bg-green-500" : "bg-red-500"}>
                                                        {search.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(search.createdAt)}</TableCell>
                                                <TableCell>{formatDate(search.updatedAt)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => toggleStatus(search._id, search.active)}
                                                        >
                                                            {search.active ? "Deactivate" : "Activate"}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(search)}
                                                        >
                                                            <Edit size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(search._id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-500">
                                    Showing page {currentPage} of {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToPrevPage}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft size={16} />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Search Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Edit Search" : "Add New Search"}</DialogTitle>
                        <DialogDescription>
                            {isEditMode
                                ? "Update the details for this top search."
                                : "Create a new top search that will appear in the search suggestions."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <label htmlFor="searchTerm" className="text-sm font-medium">
                                    Search Term
                                </label>
                                <Input
                                    id="searchTerm"
                                    value={currentSearch.searchTerm}
                                    onChange={(e) => setCurrentSearch({ ...currentSearch, searchTerm: e.target.value })}
                                    placeholder="Enter search term"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="position" className="text-sm font-medium">
                                    Position
                                </label>
                                <Input
                                    id="position"
                                    type="number"
                                    min="1"
                                    value={currentSearch.position}
                                    onChange={(e) => setCurrentSearch({ ...currentSearch, position: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="route" className="text-sm font-medium">
                                    Where To Go on Click
                                </label>
                                <Input
                                    id="route"
                                    type="text"

                                    value={currentSearch.route}
                                    onChange={(e) => setCurrentSearch({ ...currentSearch, route: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="id" className="text-sm font-medium">
                                    On Which Product Id
                                </label>
                                <Input
                                    id="id"
                                    type="text"
                                    placeholder="Enter product id"
                                    value={currentSearch.id}
                                    onChange={(e) => setCurrentSearch({ ...currentSearch, id: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="status" className="text-sm font-medium">
                                    Status
                                </label>
                                <Select
                                    value={currentSearch.active ? "active" : "inactive"}
                                    onValueChange={(value) => setCurrentSearch({ ...currentSearch, active: value === "active" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateSearch} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-2">⊚</span>
                                    {isEditMode ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                <>{isEditMode ? "Update" : "Create"}</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AllTopSearches