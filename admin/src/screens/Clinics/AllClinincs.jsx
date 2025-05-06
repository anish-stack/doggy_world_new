import { API_URL, fetcher } from '@/constant/Urls'
import React, { useState, useEffect, useMemo, useContext } from 'react'
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
import { Search, Plus, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import AuthContext from '@/context/authContext'

const AllClinics = () => {
    const router = useNavigate()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [limit, setLimit] = useState(10)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedClinic, setSelectedClinic] = useState(null)
    const [filteredData, setFilteredData] = useState([])
    const [paginatedData, setPaginatedData] = useState([])
    const {token} = useContext(AuthContext)

    // Fetch clinic data
    const { data, error, mutate } = useSWR(
        `${API_URL}/clinic/get-all-clinic`,
        fetcher
    )

    const loading = !data && !error
    const clinics = useMemo(() => data?.data || [], [data]);

    useEffect(() => {
        if (!clinics.length) return;

        const filtered = search
            ? clinics.filter(clinic =>
                clinic.clinicName.toLowerCase().includes(search.toLowerCase()) ||
                clinic.address.toLowerCase().includes(search.toLowerCase()) ||
                clinic.email.toLowerCase().includes(search.toLowerCase()) ||
                clinic.attendentName.toLowerCase().includes(search.toLowerCase())
            )
            : clinics;

        setFilteredData(filtered);

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        setPaginatedData(filtered.slice(startIndex, endIndex));

    }, [clinics, search, page, limit]);

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / limit);

    // Handle search
    const handleSearch = (e) => {
        setPage(1)
        setSearch(e.target.value)
    }

    const handleOpenDeleteDialog = (clinic) => {
        setSelectedClinic(clinic)
        setIsDeleteDialogOpen(true)
    }

    // Handle delete clinic
    const handleDeleteClinic = async () => {
        if (!selectedClinic) return;

        try {
            const response = await axios.delete(`${API_URL}/clinic/delete/${selectedClinic._id}`,{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            });

            if (response.status === 200) {
                mutate();
                setIsDeleteDialogOpen(false);
            } else {
                console.error('Failed to delete clinic', response);
                alert('Failed to delete clinic');
            }
        } catch (error) {
            console.error('Error deleting clinic:', error);
            alert(error.response.data.message || "Please try Again later");
        }
    };

    // Navigate to edit page
    const handleEdit = (clinic) => {
        router(`/dashboard/add-new-clinic?id=${clinic._id}`);
    }

    // Navigate to view page
    const handleView = (clinic) => {
        router(`/dashboard/add-new-clinic?id=${clinic._id}`);
    }

    // Navigate to add new clinic page
    const handleAddNewClinic = () => {
        router('/dashboard/add-new-clinic');
    }

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
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl">All Clinics</CardTitle>
                    <Button className="flex items-center gap-2" onClick={handleAddNewClinic}>
                        <Plus size={16} />
                        Add New Clinic
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Search by name, address, email..."
                                className="pl-10"
                                value={search}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Show</span>
                            <Select value={limit.toString()} onValueChange={handleLimitChange}>
                                <SelectTrigger className="w-16">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-gray-500">per page</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center text-gray-500">Loading clinics...</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">S.No</TableHead>
                                            <TableHead className="w-20">Image</TableHead>
                                            <TableHead>Clinic Name</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead>Contact Info</TableHead>
                                            <TableHead>Timings</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-32 text-center">
                                                    No clinics found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedData.map((clinic, index) => (
                                                <TableRow key={clinic._id}>
                                                    <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                                                    <TableCell >
                                                        <img
                                                            src={clinic.imageUrl && clinic.imageUrl.length > 0
                                                                ? clinic.imageUrl[0].url
                                                                : "https://i.ibb.co/KcP7PWKZ/images.png"}
                                                            alt={clinic.clinicName}
                                                            className="w-10 h-10 object-cover rounded-md"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm truncate break-words max-w-[300px]">{clinic.clinicName}</div>
                                                        <div className="text-xs text-gray-500">Rating: {clinic.rating} ⭐</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-[200px] truncate break-words text-sm">{clinic.address}</div>
                                                        <a href={clinic.mapLocation} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">View on Maps</a>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">{clinic.phone}</div>
                                                        <div className="text-sm">{clinic.email}</div>
                                                        <div className="text-sm text-gray-500">Attendant: {clinic.attendentName}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">{clinic.openTime} - {clinic.closeTime}</div>
                                                        <div className="text-sm text-gray-500">Off Day: {clinic.offDay}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {clinic.anyCloseDate ? "Temporarily Closed" : "Open"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm capitalize truncate break-words max-w-[100px]">{clinic.role}</div>

                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`px-2 py-1 rounded text-xs ${clinic.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {clinic.isVerified ? 'Verified' : 'Unverified'}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded text-xs ${clinic.scanTestAvailableStatus ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                {clinic.scanTestAvailableStatus ? 'Scan Available' : 'No Scans'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Open menu</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />

                                                                <DropdownMenuItem onClick={() => handleEdit(clinic)}>
                                                                    Edit Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleOpenDeleteDialog(clinic)}
                                                                >
                                                                    Delete Clinc
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>

                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-6">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                                    disabled={page === 1}
                                                    className={page === 1 ? "cursor-not-allowed opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                            {renderPaginationLinks()}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                                    disabled={page === totalPages}
                                                    className={page === totalPages ? "cursor-not-allowed opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}

                            <div className="mt-4 text-sm text-gray-500 text-center">
                                Showing {paginatedData.length} of {totalItems} clinics
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the clinic:
                            <span className="font-semibold block mt-2">
                                {selectedClinic?.clinicName}
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteClinic}
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

export default AllClinics