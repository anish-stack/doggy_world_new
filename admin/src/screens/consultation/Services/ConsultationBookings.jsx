
import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { format,} from "date-fns"


import { Search, ChevronLeft, ChevronRight, Filter, Calendar, Clock, User, ArrowUpDown } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { useNavigate } from "react-router-dom"

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    rescheduled: "bg-purple-100 text-purple-800",
}

const ConsultationBookings = () => {
    const router = useNavigate()
    const [consultations, setConsultations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState("all")

    // Fetch consultations
    const fetchConsultations = async () => {
        setLoading(true)
        try {
            const response = await axios.get("http://localhost:8000/api/v1/all-consultations-booking")

            // Assuming the API returns an array of consultations
            let filteredData = response.data.data
            // Apply filters
            if (searchTerm) {
                filteredData = filteredData.filter(consultation =>
                    consultation?.pet.petname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    consultation.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    consultation.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    consultation.pet?.petOwnertNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    consultation._id?.includes(searchTerm)
                )
            }

            if (statusFilter !== "all") {
                filteredData = filteredData.filter(consultation =>
                    consultation.status?.toLowerCase() === statusFilter.toLowerCase()
                )
            }

            if (dateFilter !== "all") {
                const today = new Date()
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)
                const nextWeek = new Date(today)
                nextWeek.setDate(nextWeek.getDate() + 7)
                const nextMonth = new Date(today)
                nextMonth.setMonth(nextMonth.getMonth() + 1)

                filteredData = filteredData.filter(consultation => {
                    const consultationDate = new Date(consultation.date)

                    switch (dateFilter) {
                        case "today":
                            return consultationDate.toDateString() === today.toDateString()
                        case "tomorrow":
                            return consultationDate.toDateString() === tomorrow.toDateString()
                        case "week":
                            return consultationDate > today && consultationDate <= nextWeek
                        case "month":
                            return consultationDate > today && consultationDate <= nextMonth
                        default:
                            return true
                    }
                })
            }

            // Calculate pagination
            setTotalPages(Math.ceil(filteredData.length / itemsPerPage))

            // Apply pagination
            const startIndex = (currentPage - 1) * itemsPerPage
            const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

            setConsultations(paginatedData)
            setLoading(false)
        } catch (err) {
            setError("Failed to fetch consultations")
            toast.error("Failed to fetch consultations")
            setLoading(false)
            console.error(err)
        }
    }

    useEffect(() => {
        fetchConsultations()
    }, [currentPage, searchTerm, statusFilter, dateFilter, itemsPerPage])

    const handleViewConsultation = (id) => {
        router(`/dashboard/consultations/${id}`)
    }

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1) // Reset to first page on new search
    }

    const handleStatusFilter = (value) => {
        setStatusFilter(value)
        setCurrentPage(1) // Reset to first page on new filter
    }

    const handleDateFilter = (value) => {
        setDateFilter(value)
        setCurrentPage(1) // Reset to first page on new filter
    }

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(parseInt(value))
        setCurrentPage(1) // Reset to first page when changing items per page
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold">Consultation Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search and Filter Section */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by patient, doctor or ID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <span className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        <span>Status</span>
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={dateFilter} onValueChange={handleDateFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Date</span>
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Dates</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                                <SelectTrigger className="w-[180px]">
                                    <span className="flex items-center gap-2">
                                        <span>Show</span>
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 per page</SelectItem>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="20">20 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Consultations Table */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">{error}</div>
                    ) : consultations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No consultations found. Try adjusting your filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">ID</TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Patient
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Doctor
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Date
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {consultations.map((consultation) => (
                                        <TableRow key={consultation._id}>
                                            <TableCell className="font-medium">{consultation._id.substring(0, 8)}...</TableCell>
                                            <TableCell>{consultation?.pet.petname || "N/A"}</TableCell>
                                            <TableCell>{consultation?.doctorId.name || "N/A"}</TableCell>
                                            <TableCell>
                                                {consultation.date ? format(new Date(consultation.date), "MMM dd, yyyy") : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {consultation.time || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={statusColors[consultation.status?.toLowerCase()] || "bg-gray-100 text-gray-800"}
                                                >
                                                    {consultation.status || "Unknown"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewConsultation(consultation._id)}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && !error && consultations.length > 0 && (
                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNumber;

                                        if (totalPages <= 5) {
                                            pageNumber = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNumber = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNumber = totalPages - 4 + i;
                                        } else {
                                            pageNumber = currentPage - 2 + i;
                                        }

                                        return (
                                            <PaginationItem key={i}>
                                                <PaginationLink
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    isActive={currentPage === pageNumber}
                                                >
                                                    {pageNumber}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}

                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default ConsultationBookings