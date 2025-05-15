import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import { Search, Filter, Calendar, ArrowUpDown, Eye, Trash2, CalendarClock, MoreHorizontal, CheckCircle, XCircle, Clock } from 'lucide-react'

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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const statusColors = {
    Pending: "bg-yellow-100 text-yellow-800",
    Confirmed: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
    Completed: "bg-blue-100 text-blue-800",
    Rescheduled: "bg-purple-100 text-purple-800",
}

const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
]

const VaccineBookings = () => {
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
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

    // Reschedule dialog state
    const [rescheduleOpen, setRescheduleOpen] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState(null)
    const [selectedDate, setSelectedDate] = useState(null)
    const [selectedTime, setSelectedTime] = useState("")
    const [rescheduleLoading, setRescheduleLoading] = useState(false)

    // Delete dialog state
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Cancel dialog state
    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelLoading, setCancelLoading] = useState(false)

    // Fetch bookings
    const fetchBookings = async () => {
        setLoading(true)
        try {
            const response = await axios.get("http://localhost:8000/api/v1/vaccine-orders")

            // Assuming the API returns { success, message, data } where data is an array of bookings
            let filteredData = response.data.data || []

            // Apply filters
            if (searchTerm) {
                filteredData = filteredData.filter(
                    (booking) =>
                        (booking.pet?.petname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (booking.vaccine?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (booking.bookingRef || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (booking._id || "").includes(searchTerm),
                )
            }

            if (statusFilter !== "all") {
                filteredData = filteredData.filter(
                    (booking) => booking.status?.toLowerCase() === statusFilter.toLowerCase(),
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

                filteredData = filteredData.filter((booking) => {
                    const bookingDate = new Date(booking.selectedDate)

                    switch (dateFilter) {
                        case "today":
                            return bookingDate.toDateString() === today.toDateString()
                        case "tomorrow":
                            return bookingDate.toDateString() === tomorrow.toDateString()
                        case "week":
                            return bookingDate > today && bookingDate <= nextWeek
                        case "month":
                            return bookingDate > today && bookingDate <= nextMonth
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

            setBookings(paginatedData)
            setLoading(false)
        } catch (err) {
            setError("Failed to fetch physiotherapy bookings")
            toast.error("Failed to fetch physiotherapy bookings")
            setLoading(false)
            console.error(err)
        }
    }

    useEffect(() => {
        fetchBookings()
    }, [currentPage, searchTerm, statusFilter, dateFilter, itemsPerPage])

    const handleViewBooking = (id) => {
        navigate(`/dashboard/vaccination-booking/${id}`)
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
        setItemsPerPage(Number.parseInt(value))
        setCurrentPage(1) // Reset to first page when changing items per page
    }

    const openRescheduleDialog = (booking) => {
        setSelectedBooking(booking)
        setSelectedDate(booking.rescheduledDate ? new Date(booking.rescheduledDate) : new Date(booking.date))
        setSelectedTime(booking.rescheduledTime || booking.time)
        setRescheduleOpen(true)
    }

    const openDeleteDialog = (booking) => {
        setSelectedBooking(booking)
        setDeleteOpen(true)
    }

    const openCancelDialog = (booking) => {
        setSelectedBooking(booking)
        setCancelOpen(true)
    }

    const handleReschedule = async () => {
        if (!selectedDate || !selectedTime) {
            toast.error("Please select both date and time")
            return
        }

        setRescheduleLoading(true)
        try {
            const formattedDate = format(selectedDate, "yyyy-MM-dd")

            await axios.put("http://localhost:8000/api/v1/add-first-vaccine-reschudle", {
                id: selectedBooking._id,
                rescheduledDate: formattedDate,
                rescheduledTime: selectedTime,
                status: "Rescheduled",
            })

            toast.success("Booking rescheduled successfully")
            setRescheduleOpen(false)
            fetchBookings() // Refresh data
        } catch (err) {
            toast.error("Failed to reschedule booking")
            console.error(err)
        } finally {
            setRescheduleLoading(false)
        }
    }

    const handleDelete = async () => {
        setDeleteLoading(true)
        try {
            await axios.delete(`http://localhost:8000/api/v1/delete-vaccine-orders/${selectedBooking._id}`)

            toast.success("Booking deleted successfully")
            setDeleteOpen(false)
            fetchBookings() // Refresh data
        } catch (err) {
            toast.error("Failed to delete booking")
            console.error(err)
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleCancel = async () => {
        setCancelLoading(true)
        try {
            await axios.put(
                `http://localhost:8000/api/v1/cancel-vaccine-orders?id=${selectedBooking._id}&status=Cancelled`,
            )

            toast.success("Booking cancelled successfully")
            setCancelOpen(false)
            fetchBookings() // Refresh data
        } catch (err) {
            toast.error("Failed to cancel booking")
            console.error(err)
        } finally {
            setCancelLoading(false)
        }
    }

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount)
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold">Vaccination Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search and Filter Section */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by pet name, therapy, booking ref or ID..."
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

                    {/* Bookings Table */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">{error}</div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No vaccinations bookings found. Try adjusting your filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Booking Ref</TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Pet
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead>
                                            <div className="flex items-center gap-1">
                                                Vaccine
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
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookings.map((booking) => (
                                        <TableRow key={booking._id}>
                                            <TableCell className="font-medium">{booking.bookingRef || "N/A"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {booking.pet?.petname?.charAt(0) || "P"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{booking.pet?.petname || "N/A"}</p>
                                                        <p className="text-xs text-muted-foreground">{booking.pet?.petbreed || "Unknown"}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {booking.vaccine?.mainImage && booking.vaccine.mainImage ? (
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={booking.vaccine.mainImage.url || "/placeholder.svg"} alt={booking.vaccine.title} />
                                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                                {booking.vaccine.title?.charAt(0) || "T"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ) : (
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                                {booking.vaccine?.title?.charAt(0) || "T"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{booking.vaccine?.title || "N/A"}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {booking?.bookingType === 'Home'
                                                                ? formatCurrency(booking.vaccine?.home_price_of_package_discount || 0)
                                                                : formatCurrency(booking.vaccine?.discount_price || 0)}
                                                        </p>

                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {booking.rescheduledDate ? (
                                                    <div>
                                                        <p>{format(new Date(booking.rescheduledDate), "MMM dd, yyyy")}</p>
                                                        <p className="text-xs text-muted-foreground line-through">
                                                            {format(new Date(booking.selectedDate), "MMM dd, yyyy")}
                                                        </p>
                                                    </div>
                                                ) : booking.selectedDate ? (
                                                    format(new Date(booking.selectedDate), "MMM dd, yyyy")
                                                ) : (
                                                    "N/A"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {booking.rescheduledTime ? (
                                                    <div>
                                                        <p>{booking.rescheduledTime}</p>
                                                        <p className="text-xs text-muted-foreground line-through">{booking.selectedTime}</p>
                                                    </div>
                                                ) : (
                                                    booking.selectedTime || "N/A"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[booking.status] || "bg-gray-100 text-gray-800"}>
                                                    {booking.status || "Unknown"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        booking.paymentComplete ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                                    }
                                                >
                                                    {booking.paymentComplete ? "Paid" : "Pending"}
                                                </Badge>
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
                                                        <DropdownMenuItem onClick={() => handleViewBooking(booking._id)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {booking.status !== "Cancelled" && booking.status !== "Completed" && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => openRescheduleDialog(booking)}>
                                                                    <CalendarClock className="mr-2 h-4 w-4" />
                                                                    Reschedule
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openCancelDialog(booking)}>
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    Cancel
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openDeleteDialog(booking)} className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && !error && bookings.length > 0 && (
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
                                        let pageNumber

                                        if (totalPages <= 5) {
                                            pageNumber = i + 1
                                        } else if (currentPage <= 3) {
                                            pageNumber = i + 1
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNumber = totalPages - 4 + i
                                        } else {
                                            pageNumber = currentPage - 2 + i
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
                                        )
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

            {/* Reschedule Dialog */}
            <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reschedule First Doss Vaccination</DialogTitle>
                        <DialogDescription>Select a new date and time for the Vaccination session.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <CalendarComponent
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date()}
                                className="rounded-md border"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="time">Time</Label>
                            <Select value={selectedTime} onValueChange={setSelectedTime}>
                                <SelectTrigger id="time">
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeSlots.map((time) => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleReschedule} disabled={rescheduleLoading}>
                            {rescheduleLoading ? "Rescheduling..." : "Reschedule"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this booking? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this Vaccination booking? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelOpen(false)}>
                            No, Keep It
                        </Button>
                        <Button variant="destructive" onClick={handleCancel} disabled={cancelLoading}>
                            {cancelLoading ? "Cancelling..." : "Yes, Cancel It"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default VaccineBookings
