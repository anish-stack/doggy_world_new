
import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Search, Filter, ChevronLeft, ChevronRight, FileText, Download, AlertCircle, Check, X, Upload, File, Trash2, AlertTriangle, Loader2 } from 'lucide-react'

// Import shadcn components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

// Status color mapping
const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
  Confirmed: "bg-green-100 text-green-800 border-green-200",
  Completed: "bg-blue-100 text-blue-800 border-blue-200",
  "Facing Error": "bg-orange-100 text-orange-800 border-orange-200",
  Rescheduled: "bg-purple-100 text-purple-800 border-purple-200"
}

// Time slots for rescheduling
const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30"
]

// API URL - replace with your actual API URL
const API_URL = "http://localhost:8000/api/v1"

const AllLabOrders = () => {
  // State for bookings and pagination
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalBookings: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Filters state
  const [filters, setFilters] = useState({
    date: "",
    status: "",
    bookingType: "",
    search: ""
  })

  // Selected booking for actions
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Report states
  const [reportFiles, setReportFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingReports, setUploadingReports] = useState(false)
  const [reportError, setReportError] = useState(null)

  // Dialog states
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [generateReportOpen, setGenerateReportOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [viewReportOpen, setViewReportOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  // Form states
  const [newStatus, setNewStatus] = useState("")
  const [rescheduleDate, setRescheduleDate] = useState(null)
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "IN"
  })
  const [updateAddress, setUpdateAddress] = useState(false)

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', pagination.currentPage.toString())
      params.append('limit', pagination.limit.toString())

      if (filters.date) params.append('date', filters.date)
      if (filters.status) params.append('status', filters.status)
      if (filters.bookingType) params.append('bookingType', filters.bookingType)
      if (filters.search) params.append('search', filters.search)

      const response = await axios.get(`${API_URL}/lab-tests-booking?${params.toString()}`)

      if (response.data.success) {
        setBookings(response.data.data.bookings)
        setPagination({
          currentPage: response.data.data.pagination.currentPage,
          totalPages: response.data.data.pagination.totalPages,
          limit: response.data.data.pagination.limit,
          totalBookings: response.data.data.pagination.totalBookings,
          hasNextPage: response.data.data.pagination.hasNextPage,
          hasPrevPage: response.data.data.pagination.hasPrevPage
        })
      } else {
        setError("Failed to fetch bookings")
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching bookings")
    } finally {
      setLoading(false)
    }
  }, [pagination.currentPage, pagination.limit, filters])

  // Initial load and when dependencies change
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
    setPagination(prev => ({
      ...prev,
      currentPage: 1 // Reset to first page when filters change
    }))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      date: "",
      status: "",
      bookingType: "",
      search: ""
    })
  }

  // Handle update status
  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status')
      return
    }

    setIsSubmitting(true)
    try {
      await axios.put(`${API_URL}/lab-tests-booking/${selectedBooking._id}/status`, {
        status: newStatus
      })

      toast.success(`Booking status updated to ${newStatus}`)
      setUpdateStatusOpen(false)
      fetchBookings()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle file selection for reports
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    
    // Validate file size (5MB max per file)
    const invalidFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024)
    
    if (invalidFiles.length > 0) {
      setReportError(`${invalidFiles.length} file(s) exceed the 5MB limit`)
      toast.error("Some files exceed the 5MB size limit", {
        description: "Please select files smaller than 5MB each"
      })
      
      // Filter out invalid files
      const validFiles = selectedFiles.filter(file => file.size <= 5 * 1024 * 1024)
      setReportFiles(validFiles)
    } else {
      setReportError(null)
      setReportFiles(selectedFiles)
    }
  }

  // Remove a file from the report files list
  const removeFile = (index) => {
    setReportFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handle report upload
  const handleUploadReport = async () => {
    if (reportFiles.length === 0) {
      toast.error('Please select at least one report file')
      return
    }

    setUploadingReports(true)
    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      
      reportFiles.forEach(file => {
        formData.append('reports', file)
      })

      const response = await axios.post(
        `${API_URL}/lab-tests-report/${selectedBooking._id}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        }
      )

      if (response.data.success) {
        toast.success("Reports uploaded successfully", {
          description: "The lab test reports have been uploaded"
        })
        
        setGenerateReportOpen(false)
        setReportFiles([])
        fetchBookings()
      } else {
        toast.error("Failed to upload reports")
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload reports")
    } finally {
      setUploadingReports(false)
    }
  }

  // Handle reschedule
  const handleReschedule = async () => {
    if (!rescheduleDate) {
      toast.error("Please select a date")
      return
    }

    if (!rescheduleTime) {
      toast.error("Please select a time")
      return
    }

    setIsSubmitting(true)
    try {
      const formattedDate = format(rescheduleDate, 'yyyy-MM-dd')

      const payload = {
        rescheduledDate: formattedDate,
        rescheduledTime: rescheduleTime,
        status: "Rescheduled"
      }

      // If updating address for home bookings
      if (selectedBooking.bookingType === 'Home' && updateAddress) {
        if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
          toast.error("Please fill all address fields")
          setIsSubmitting(false)
          return
        }

        payload.Address = addressForm
      }

      const response = await axios.put(`${API_URL}/lab-tests-booking-reschedule?id=${selectedBooking._id}&type=reschedule`, payload)

      if (response.data.success) {
        toast.success("Appointment rescheduled successfully")
        setRescheduleOpen(false)
        fetchBookings()
      } else {
        toast.error(response.data.message || "Failed to reschedule appointment")
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reschedule appointment")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete booking
  const handleDeleteBooking = async () => {
    setIsSubmitting(true)
    try {
      await axios.delete(`${API_URL}/lab-tests-booking-delete/${selectedBooking._id}`)

      toast.success('Lab test booking has been deleted successfully')
      setDeleteConfirmOpen(false)
      fetchBookings()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel booking
  const handleCancelBooking = async () => {
    setIsSubmitting(true)
    try {
      await axios.put(`${API_URL}/lab-booking-cancel?id=${selectedBooking._id}&status=Cancelled`)

      toast.success("Booking cancelled successfully")
      setCancelConfirmOpen(false)
      fetchBookings()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'PPP')
  }

  // Open booking details
  const openBookingDetails = (booking) => {
    setSelectedBooking(booking)

    // Pre-fill address form if it's a home booking
    if (booking.bookingType === 'Home' && booking.Address) {
      setAddressForm({
        street: booking.Address.street || "",
        city: booking.Address.city || "",
        state: booking.Address.state || "",
        zipCode: booking.Address.zipCode || "",
        country: booking.Address.country || "IN"
      })
    }

    setViewDetailsOpen(true)
  }

  // Open reschedule dialog
  const openRescheduleDialog = (booking) => {
    setSelectedBooking(booking)

    // Pre-fill with current values
    const currentDate = booking.rescheduledDate ? new Date(booking.rescheduledDate) : new Date(booking.selectedDate)
    setRescheduleDate(currentDate)
    setRescheduleTime(booking.rescheduledTime || booking.selectedTime)

    // Pre-fill address form if it's a home booking
    if (booking.bookingType === 'Home' && booking.Address) {
      setAddressForm({
        street: booking.Address.street || "",
        city: booking.Address.city || "",
        state: booking.Address.state || "",
        zipCode: booking.Address.zipCode || "",
        country: booking.Address.country || "IN"
      })
    }

    setUpdateAddress(false)
    setRescheduleOpen(true)
  }

  // Open report view dialog
  const openReportView = (report) => {
    setSelectedReport(report)
    setViewReportOpen(true)
  }

  // Get file size in readable format
  const getFileSize = (size) => {
    if (size < 1024) {
      return `${size} B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
    }
  }

  // Loading skeleton
  if (loading && bookings.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
            <div className="rounded-md border">
              <div className="p-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full my-2" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Lab Test Orders</CardTitle>
          <CardDescription>
            Manage all lab test bookings and their statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="date-filter" className="mb-1.5 block">Date</Label>
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.date ? format(new Date(filters.date), 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.date ? new Date(filters.date) : undefined}
                      onSelect={(date) => handleFilterChange('date', date ? format(date, 'yyyy-MM-dd') : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Facing Error">Facing Error</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type-filter">Booking Type</Label>
              <Select value={filters.bookingType} onValueChange={(value) => handleFilterChange('bookingType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Clinic">Clinic</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search-filter" className="mb-1.5 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-filter"
                  placeholder="Search by ref or pet name"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>

          {/* Bookings Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Booking Ref</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-10 w-10 mb-2 opacity-20" />
                        <p>No bookings found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking._id} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">{booking.bookingRef}</TableCell>
                      <TableCell>
                        <div className="font-medium">{booking.pet?.petname || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{booking.pet?.petOwnertNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{formatDate(booking.selectedDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{booking.selectedTime}</span>
                        </div>
                        {booking.rescheduledDate && (
                          <div className="mt-1.5">
                            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-800">
                              Rescheduled: {formatDate(booking.rescheduledDate)} {booking.rescheduledTime}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {booking.labTests?.map((test, idx) => (
                            <div key={idx} className="text-sm truncate">
                              {test.title}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.bookingType === 'Home' ? 'secondary' : 'outline'} className="capitalize">
                          {booking.bookingType === 'Home' ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>Home</span>
                            </div>
                          ) : (
                            <span>Clinic</span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(booking.totalPayableAmount)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[booking.status]}>
                          {booking.status}
                        </Badge>
                        {booking.Report && booking.Report.length > 0 && (
                          <Badge variant="outline" className="ml-2 bg-blue-50 border-blue-200 text-blue-800">
                            Has Reports
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openBookingDetails(booking)}
                          >
                            <span className="sr-only">View details</span>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => openRescheduleDialog(booking)}
                          >
                            <span className="sr-only">Reschedule</span>
                            <Calendar className="h-4 w-4" />
                          </Button>
                          {booking.status === 'Completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setGenerateReportOpen(true)
                              }}
                            >
                              <span className="sr-only">Generate Report</span>
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {bookings.length} of {pagination.totalBookings} bookings
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    currentPage: prev.currentPage - 1
                  }))}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={pagination.currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPagination(prev => ({
                        ...prev,
                        currentPage: i + 1
                      }))}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    currentPage: prev.currentPage + 1
                  }))}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      {selectedBooking && (
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">Booking Details</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <span>Reference:</span>
                <Badge variant="outline" className="font-mono">{selectedBooking.bookingRef}</Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="tests">Lab Tests</TabsTrigger>
                  <TabsTrigger value="reports" className="relative">
                    Reports
                    {selectedBooking.Report && selectedBooking.Report.length > 0 && (
                      <Badge className="ml-2 bg-blue-500 text-white">{selectedBooking.Report.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Patient Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Pet Name</h4>
                          <p className="font-medium">{selectedBooking.pet?.petname || 'Unknown'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Owner Contact</h4>
                          <p>{selectedBooking.pet?.petOwnertNumber || 'N/A'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Booking Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Booking Type</h4>
                          <Badge variant={selectedBooking.bookingType === 'Home' ? 'secondary' : 'outline'} className="mt-1">
                            {selectedBooking.bookingType}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                          <Badge className={`mt-1 ${statusColors[selectedBooking.status]}`}>
                            {selectedBooking.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Appointment Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Original Date & Time</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(selectedBooking.selectedDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedBooking.selectedTime}</span>
                            </div>
                          </div>

                          {selectedBooking.rescheduledDate && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Rescheduled To</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-purple-600" />
                                <span>{formatDate(selectedBooking.rescheduledDate)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-purple-600" />
                                <span>{selectedBooking.rescheduledTime}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <Separator className="my-4" />

                        {selectedBooking.bookingType === 'Clinic' && selectedBooking.clinic && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Clinic</h4>
                            <p className="font-medium mt-1">{selectedBooking.clinic.clinicName}</p>
                            <div className="flex items-start gap-2 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm text-muted-foreground">{selectedBooking.clinic.address}</p>
                            </div>
                          </div>
                        )}

                        {selectedBooking.bookingType === 'Home' && selectedBooking.Address && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Home Address</h4>
                            <div className="flex items-start gap-2 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">{selectedBooking.Address.street}</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedBooking.Address.city}, {selectedBooking.Address.state}, {selectedBooking.Address.zipCode}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="tests" className="pt-4">
                  <div className="space-y-4">
                    {selectedBooking.labTests?.map((test, idx) => (
                      <Card key={idx}>
                        <CardHeader className="pb-2 flex flex-row items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{test.title}</CardTitle>
                          </div>
                          {test.mainImage?.url && (
                            <div className="h-12 w-12 rounded-md overflow-hidden">
                              <img
                                src={test.mainImage.url || "/placeholder.svg"}
                                alt={test.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Regular Price</p>
                              <p className="font-medium">{formatPrice(test.price)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Discounted Price</p>
                              <p className="font-medium text-green-600">{formatPrice(test.discount_price)}</p>
                            </div>
                            {selectedBooking.bookingType === 'Home' && (
                              <>
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">Home Visit Price</p>
                                  <p className="font-medium">{formatPrice(test.home_price_of_package)}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">Home Visit Discounted</p>
                                  <p className="font-medium text-green-600">{formatPrice(test.home_price_of_package_discount)}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reports" className="pt-4">
                  {selectedBooking.Report && selectedBooking.Report.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Test Reports</h3>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          Reports auto-delete after 7 days
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4">
                        {selectedBooking.Report.map((report, idx) => (
                          <Card key={idx} className="overflow-hidden">
                            <div className="flex items-center p-4 bg-muted/30">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="bg-primary/10 p-2 rounded-md">
                                  <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Report #{idx + 1}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {report.date ? formatDate(report.date) : 'Date not available'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(report.url, '_blank')}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => openReportView(report)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={() => {
                            setGenerateReportOpen(true)
                            setViewDetailsOpen(false)
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload More Reports
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="bg-muted/30 p-4 rounded-full mb-4">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Reports Available</h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        There are no test reports uploaded for this booking yet. You can generate and upload reports if the test is completed.
                      </p>
                      {selectedBooking.status === 'Completed' && (
                        <Button
                          onClick={() => {
                            setGenerateReportOpen(true)
                            setViewDetailsOpen(false)
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex justify-between items-center mt-6">
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setViewDetailsOpen(false)
                      setDeleteConfirmOpen(true)
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                    onClick={() => {
                      setViewDetailsOpen(false)
                      openRescheduleDialog(selectedBooking)
                    }}
                  >
                    Reschedule
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    onClick={() => {
                      setViewDetailsOpen(false)
                      setUpdateStatusOpen(true)
                    }}
                  >
                    Update Status
                  </Button>
                  {selectedBooking.status !== 'Cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setViewDetailsOpen(false)
                        setCancelConfirmOpen(true)
                      }}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedBooking.status === 'Completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setViewDetailsOpen(false)
                        setGenerateReportOpen(true)
                      }}
                    >
                      {selectedBooking.Report && selectedBooking.Report.length > 0 ? 'Upload More Reports' : 'Generate Report'}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setViewDetailsOpen(false)}>Close</Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Status Dialog */}
      {selectedBooking && (
        <Dialog open={updateStatusOpen} onOpenChange={setUpdateStatusOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Status</DialogTitle>
              <DialogDescription>
                Change the status for booking {selectedBooking.bookingRef}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="new-status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="new-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Facing Error">Facing Error</SelectItem>
                    <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setUpdateStatusOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleUpdateStatus} disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update Status'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Generate Report Dialog */}
      {selectedBooking && (
        <Dialog open={generateReportOpen} onOpenChange={setGenerateReportOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Lab Test Reports</DialogTitle>
              <DialogDescription>
                Upload PDF reports for booking {selectedBooking.bookingRef}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Reports will be automatically deleted after 7 days. Each PDF must be less than 5MB.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Label htmlFor="report-files">Upload PDF Reports</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                  <Input
                    id="report-files"
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Drag & drop files here or click to browse</p>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF files up to 5MB each
                      </p>
                    </div>
                  </div>
                </div>

                {reportError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{reportError}</AlertDescription>
                  </Alert>
                )}

                {reportFiles.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h4 className="text-sm font-medium">Selected Files ({reportFiles.length})</h4>
                    <ScrollArea className="h-[200px] rounded-md border p-2">
                      <div className="space-y-2">
                        {reportFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-3">
                              <File className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium truncate max-w-[300px]">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{getFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => removeFile(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove file</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {uploadingReports && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setGenerateReportOpen(false)} disabled={uploadingReports}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadReport} 
                disabled={uploadingReports || reportFiles.length === 0}
                className="relative"
              >
                {uploadingReports ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Reports
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Report Dialog */}
      {selectedReport && (
        <Dialog open={viewReportOpen} onOpenChange={setViewReportOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>View Report</DialogTitle>
              <DialogDescription>
                {selectedReport.date ? `Uploaded on ${formatDate(selectedReport.date)}` : 'Report details'}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 h-[70vh] w-full">
              <iframe 
                src={selectedReport.url} 
                className="w-full h-full border rounded-md"
                title="Report PDF Viewer"
              />
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => window.open(selectedReport.url, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setViewReportOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reschedule Dialog */}
      {selectedBooking && (
        <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reschedule Appointment</DialogTitle>
              <DialogDescription>
                Update the appointment date and time for booking {selectedBooking.bookingRef}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reschedule-date" className="mb-1.5 block">New Date</Label>
                  <div className="border max-w-2xl rounded-md p-3">
                    <CalendarComponent
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={setRescheduleDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className="mx-auto max-w-2xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reschedule-time" className="mb-1.5 block">New Time</Label>
                  <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                    <SelectTrigger id="reschedule-time">
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

              {selectedBooking.bookingType === 'Home' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="update-address"
                      checked={updateAddress}
                      onCheckedChange={(checked) => setUpdateAddress(checked === true)}
                    />
                    <Label htmlFor="update-address">Update address</Label>
                  </div>

                  {updateAddress && (
                    <div className="space-y-4 border rounded-md p-4">
                      <div>
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          placeholder="Enter street address"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            placeholder="Enter city"
                          />
                        </div>

                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            placeholder="Enter state"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zipCode">Zip Code</Label>
                          <Input
                            id="zipCode"
                            value={addressForm.zipCode}
                            onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                            placeholder="Enter zip code"
                          />
                        </div>

                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Select
                            value={addressForm.country}
                            onValueChange={(value) => setAddressForm({ ...addressForm, country: value })}
                          >
                            <SelectTrigger id="country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IN">India</SelectItem>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="GB">United Kingdom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setRescheduleOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleReschedule} disabled={isSubmitting || !rescheduleDate || !rescheduleTime}>
                {isSubmitting ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    <span>Rescheduling...</span>
                  </div>
                ) : (
                  'Reschedule'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedBooking && (
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete booking {selectedBooking.bookingRef}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will permanently delete the booking and all associated data.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteBooking} disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete Booking'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Confirmation Dialog */}
      {selectedBooking && (
        <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Cancellation</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel booking {selectedBooking.bookingRef}?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setCancelConfirmOpen(false)} disabled={isSubmitting}>No, Keep It</Button>
              <Button variant="destructive" onClick={handleCancelBooking} disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    <span>Cancelling...</span>
                  </div>
                ) : (
                  'Yes, Cancel Booking'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default AllLabOrders
