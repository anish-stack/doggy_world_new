
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Search, Filter, ChevronLeft, ChevronRight, FileText, Download, AlertCircle, Check, X } from 'lucide-react';

// Import shadcn components
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from '@/components/ui/checkbox';
import { API_URL } from '@/constant/Urls';

// Status color mapping
const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
  Confirmed: "bg-green-100 text-green-800 border-green-200",
  Completed: "bg-blue-100 text-blue-800 border-blue-200",
  "Facing Error": "bg-orange-100 text-orange-800 border-orange-200",
  Rescheduled: "bg-purple-100 text-purple-800 border-purple-200"
};

// Time slots for rescheduling
const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30"
];


const AllLabOrders = () => {
  // State for bookings and pagination
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    totalBookings: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Filters state
  const [filters, setFilters] = useState({
    date: "",
    status: "",
    bookingType: "",
    search: ""
  });

  // Selected booking for actions
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Dialog states
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [generateReportOpen, setGenerateReportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "IN"
  });
  const [updateAddress, setUpdateAddress] = useState(false);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.currentPage.toString());
      params.append('limit', pagination.limit.toString());

      if (filters.date) params.append('date', filters.date);
      if (filters.status) params.append('status', filters.status);
      if (filters.bookingType) params.append('bookingType', filters.bookingType);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_URL}/lab-tests-booking?${params.toString()}`);

      if (response.data.success) {
        setBookings(response.data.data.bookings);
        setPagination({
          currentPage: response.data.data.pagination.currentPage,
          totalPages: response.data.data.pagination.totalPages,
          limit: response.data.data.pagination.limit,
          totalBookings: response.data.data.pagination.totalBookings,
          hasNextPage: response.data.data.pagination.hasNextPage,
          hasPrevPage: response.data.data.pagination.hasPrevPage
        });
      } else {
        setError("Failed to fetch bookings");
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching bookings");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters]);

  // Initial load and when dependencies change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1 // Reset to first page when filters change
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      date: "",
      status: "",
      bookingType: "",
      search: ""
    });
  };

  // Handle update status
  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(`http://localhost:8000/api/v1/lab-tests-booking/${selectedBooking._id}/status`, {
        status: newStatus
      });

      toast({
        title: "Status Updated",
        description: `Booking status updated to ${newStatus}`,
      });

      setUpdateStatusOpen(false);
      fetchBookings();
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reschedule
  const handleReschedule = async () => {
    if (!rescheduleDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive"
      });
      return;
    }

    if (!rescheduleTime) {
      toast({
        title: "Error",
        description: "Please select a time",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = format(rescheduleDate, 'yyyy-MM-dd');

      const payload = {
        rescheduledDate: formattedDate,
        rescheduledTime: rescheduleTime,
        status: "Rescheduled"
      };

      // If updating address for home bookings
      if (selectedBooking.bookingType === 'Home' && updateAddress) {
        if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
          toast({
            title: "Error",
            description: "Please fill all address fields",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        payload.Address = addressForm;
      }

      const response = await axios.put(`http://localhost:8000/api/v1/lab-tests-booking-reschedule?id=${selectedBooking._id}&type=reschedule`, payload);

      console.log(response.data)


      setRescheduleOpen(false);
      fetchBookings();
    } catch (err) {
      console.log(err)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`${API_URL}/lab-tests-booking-delete/${selectedBooking._id}`);

      toast.success('Lab test booking has been deleted successfully');

      setDeleteConfirmOpen(false);
      fetchBookings();
    } catch (err) {
      toast.success(err.response.data.message || 'Failed to delete booking');


    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCancelBooking = async () => {
    setIsSubmitting(true);
    try {
      await axios.put(`http://localhost:8000/api/v1/lab-booking-cancel?id=${selectedBooking._id}&status=Cancelled`);

      toast({
        title: "Booking Cancelled",
        description: "Lab test booking has been cancelled successfully",
      });

      setCancelConfirmOpen(false);
      fetchBookings();
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to cancel booking",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'PPP');
  };

  // Open booking details
  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);

    // Pre-fill address form if it's a home booking
    if (booking.bookingType === 'Home' && booking.Address) {
      setAddressForm({
        street: booking.Address.street || "",
        city: booking.Address.city || "",
        state: booking.Address.state || "",
        zipCode: booking.Address.zipCode || "",
        country: booking.Address.country || "IN"
      });
    }

    setViewDetailsOpen(true);
  };

  // Open reschedule dialog
  const openRescheduleDialog = (booking) => {
    setSelectedBooking(booking);

    // Pre-fill with current values
    const currentDate = booking.rescheduledDate ? new Date(booking.rescheduledDate) : new Date(booking.selectedDate);
    setRescheduleDate(currentDate);
    setRescheduleTime(booking.rescheduledTime || booking.selectedTime);

    // Pre-fill address form if it's a home booking
    if (booking.bookingType === 'Home' && booking.Address) {
      setAddressForm({
        street: booking.Address.street || "",
        city: booking.Address.city || "",
        state: booking.Address.state || "",
        zipCode: booking.Address.zipCode || "",
        country: booking.Address.country || "IN"
      });
    }

    setUpdateAddress(false);
    setRescheduleOpen(true);
  };

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
    );
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
    );
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
          <DialogContent className="max-w-3xl overflow-scroll max-h-[95vh]">
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
                  <TabsTrigger value="payment">Payment</TabsTrigger>
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

                    {selectedBooking.ReportId && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2">Test Report</h4>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Download Report
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="payment" className="pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Payment ID</p>
                          <p className="font-mono">{selectedBooking.payment?.razorpay_payment_id || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={selectedBooking.payment?.payment_status === 'paid' ? 'success' : 'outline'} className="bg-green-100 text-green-800 border-green-200">
                            {selectedBooking.payment?.payment_status || 'N/A'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatPrice(selectedBooking.totalPayableAmount)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Coupon</p>
                          <div className="flex items-center gap-2">
                            {selectedBooking.couponCode ? (
                              <>
                                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                                  {selectedBooking.couponCode}
                                </Badge>
                                {selectedBooking.couponDiscount && selectedBooking.couponDiscount !== "0" && (
                                  <span className="text-sm text-green-600">-₹{selectedBooking.couponDiscount}</span>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">No coupon applied</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex justify-between items-center mt-6">
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setViewDetailsOpen(false);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                    onClick={() => {
                      setViewDetailsOpen(false);
                      openRescheduleDialog(selectedBooking);
                    }}
                  >
                    Reschedule
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-600 text-purple-600 hover:bg-red-50"
                    onClick={() => {
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
                        setViewDetailsOpen(false);
                        setCancelConfirmOpen(true);
                      }}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {!selectedBooking.ReportId && selectedBooking.status === 'Completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setViewDetailsOpen(false);
                        setGenerateReportOpen(true);
                      }}
                    >
                      Generate Report
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

      {/* Reschedule Dialog */}
      {selectedBooking && (
        <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-scroll">
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
  );
};

export default AllLabOrders;
