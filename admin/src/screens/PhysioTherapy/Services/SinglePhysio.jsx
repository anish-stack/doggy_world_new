
import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { format } from "date-fns"
import { useNavigate, useParams } from "react-router-dom"
import {
  Calendar,
  Clock,
  ArrowLeft,
  CalendarClock,
  XCircle,
  Trash2,
  Star,
  DollarSign,
  PawPrint,
  CheckCircle,
  CreditCard,
  Timer,
  Tag,
  ImageIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { API_URL } from "@/constant/Urls"

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

const SinglePhysio = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Reschedule state
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState("")
  const [rescheduleLoading, setRescheduleLoading] = useState(false)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Cancel dialog state
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  // Review state
  const [reviewOpen, setReviewOpen] = useState(false)
  const [ratingValue, setRatingValue] = useState(5)
  const [reviewText, setReviewText] = useState("")
  const [reviewLoading, setReviewLoading] = useState(false)

  // Status update state
  const [statusOpen, setStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusLoading, setStatusLoading] = useState(false)

  // Fetch booking details
  const fetchBooking = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/get-single-order-physio?id=${id}`)
      setBooking(response.data.data)

      // Initialize reschedule date if booking has a date
      if (response.data.data.rescheduledDate) {
        setSelectedDate(new Date(response.data.data.rescheduledDate))
      } else if (response.data.data.date) {
        setSelectedDate(new Date(response.data.data.date))
      }

      // Initialize reschedule time if booking has a time
      if (response.data.data.rescheduledTime) {
        setSelectedTime(response.data.data.rescheduledTime)
      } else if (response.data.data.time) {
        setSelectedTime(response.data.data.time)
      }

      // Initialize review if booking has a review
      if (response.data.data.review) {
        setReviewText(response.data.data.review)
      }

      // Initialize rating if booking has a rating
      if (response.data.data.rating) {
        setRatingValue(Number.parseInt(response.data.data.rating) || 5)
      }

      // Initialize status
      setNewStatus(response.data.data.status)

      setLoading(false)
    } catch (err) {
      setError("Failed to fetch physiotherapy booking details")
      toast.error("Failed to fetch physiotherapy booking details")
      setLoading(false)
      console.error(err)
    }
  }

  useEffect(() => {
    if (id) {
      fetchBooking()
    }
  }, [id])

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both date and time")
      return
    }

    setRescheduleLoading(true)
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")

      await axios.put("http://localhost:8000/api/v1/reschedule-order-physio", {
        id: booking._id,
        rescheduledDate: formattedDate,
        rescheduledTime: selectedTime,
        status: "Rescheduled",
      })

      toast.success("Booking rescheduled successfully")
      setRescheduleOpen(false)
      fetchBooking() // Refresh data
    } catch (err) {
      toast.error(err.response.data.message || "Failed to reschedule booking")
      console.error(err)
    } finally {
      setRescheduleLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await axios.delete(`http://localhost:8000/api/v1/delete-physio-booking/${booking._id}`)

      toast.success("Booking deleted successfully")
      setDeleteOpen(false)
      navigate("/physiotherapy") // Go back to list
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
      await axios.put(`http://localhost:8000/api/v1/cancel-order-of-physio?id=${booking._id}&status=Cancelled`)

      toast.success("Booking cancelled successfully")
      setCancelOpen(false)
      fetchBooking() // Refresh data
    } catch (err) {
      toast.error("Failed to cancel booking")
      console.error(err)
    } finally {
      setCancelLoading(false)
    }
  }

  const handleReview = async () => {
    if (!ratingValue) {
      toast.error("Please select a rating")
      return
    }

    setReviewLoading(true)
    try {
      // Assuming there's an endpoint for adding/updating reviews
      await axios.post(`${API_URL}/update-physio-review`, {
        id: booking._id,
        rating: ratingValue,
        review: reviewText,
      })

      toast.success("Review submitted successfully")
      setReviewOpen(false)
      fetchBooking() // Refresh data
    } catch (err) {
      toast.error("Failed to submit review")
      console.error(err)
    } finally {
      setReviewLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error("Please select a status")
      return
    }

    setStatusLoading(true)
    try {
      // Assuming there's an endpoint for updating status
      await axios.put(`http://localhost:8000/api/v1/update-physio-status`, {
        id: booking._id,
        status: newStatus,
      })

      toast.success("Status updated successfully")
      setStatusOpen(false)
      fetchBooking() // Refresh data
    } catch (err) {
      toast.error("Failed to update status")
      console.error(err)
    } finally {
      setStatusLoading(false)
    }
  }

  const goBack = () => {
    navigate("/dashboard/physiotherapy-booking")
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  // Check if user can review
  const canReview = booking?.status === "Completed"

  // Check if user can reschedule or cancel
  const canReschedule = booking?.status === "Confirmed" || booking?.status === "Rescheduled"
  const canCancel = booking?.status === "Confirmed" || booking?.status === "Rescheduled"

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-6 flex items-center gap-2" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Physiotherapy Bookings
      </Button>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : booking ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Booking Info */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold">Physiotherapy Booking Details</CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">ID: {booking._id}</p>
                    <p className="text-sm text-muted-foreground sm:before:content-['•'] sm:before:mx-2">
                      Ref: {booking.bookingRef}
                    </p>
                  </div>
                </div>
                <Badge className={statusColors[booking.status] || "bg-gray-100 text-gray-800"}>
                  {booking.status || "Unknown"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="pet">Pet Info</TabsTrigger>
                  <TabsTrigger value="therapy">Therapy Details</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Date & Time
                        </h3>
                        {booking.rescheduledDate ? (
                          <div className="mt-2">
                            <div className="flex items-center">
                              <Badge className="bg-purple-100 text-purple-800 mr-2">Rescheduled</Badge>
                              <p>
                                {format(new Date(booking.rescheduledDate), "MMMM dd, yyyy")} at{" "}
                                {booking.rescheduledTime}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Originally: {format(new Date(booking.date), "MMMM dd, yyyy")} at {booking.time}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground mt-1">
                            {booking.date ? format(new Date(booking.date), "MMMM dd, yyyy") : "Not scheduled"} at{" "}
                            {booking.time}
                          </p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Timer className="h-5 w-5 text-primary" />
                          Session Duration
                        </h3>
                        <p className="text-muted-foreground mt-1">{booking.physio?.priceMinute || "N/A"}</p>
                      </div>

                      {booking.cancelledBy && (
                        <div>
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-primary" />
                            Cancellation Details
                          </h3>
                          <p className="text-muted-foreground mt-1">Cancelled by: {booking.cancelledBy}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-primary" />
                          Payment Information
                        </h3>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                booking.paymentComplete
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {booking.paymentComplete ? "Paid" : "Pending"}
                            </Badge>
                            <Badge variant="outline">{booking.paymentCollectionType}</Badge>
                          </div>

                          {booking.paymentDetails && (
                            <div className="mt-3 space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">Amount:</span>{" "}
                                {formatCurrency(Number.parseInt(booking.paymentDetails.amount) / 100)}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Order ID:</span>{" "}
                                {booking.paymentDetails.razorpay_order_id}
                              </p>
                              {booking.paymentDetails.razorpay_payment_id && (
                                <p className="text-sm">
                                  <span className="font-medium">Payment ID:</span>{" "}
                                  {booking.paymentDetails.razorpay_payment_id}
                                </p>
                              )}
                              <p className="text-sm">
                                <span className="font-medium">Payment Status:</span>{" "}
                                <Badge
                                  className={
                                    booking.paymentDetails.payment_status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {booking.paymentDetails.payment_status}
                                </Badge>
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Date:</span>{" "}
                                {format(new Date(booking.paymentDetails.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          Booking Information
                        </h3>
                        <div className="mt-2 space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Created:</span>{" "}
                            {format(new Date(booking.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Last Updated:</span>{" "}
                            {format(new Date(booking.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Section */}
                  {booking.rating && booking.rating !== "0" && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h3 className="font-medium flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Review & Rating
                      </h3>
                      <div className="flex items-center mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Number.parseInt(booking.rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium">{booking.rating}/5</span>
                      </div>
                      {booking.review && <p className="text-sm mt-2">{booking.review}</p>}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pet" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <PawPrint className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{booking.pet?.petname || "N/A"}</h3>
                          <p className="text-muted-foreground">{booking.pet?.petbreed || "Unknown Breed"}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div>
                              <p className="text-sm font-medium">Date of Birth</p>
                              <p className="text-muted-foreground">
                                {booking.pet?.petdob ? format(new Date(booking.pet.petdob), "MMMM dd, yyyy") : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Owner Contact</p>
                              <p className="text-muted-foreground">{booking.pet?.petOwnertNumber || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Pet ID</p>
                              <p className="text-muted-foreground">{booking.pet?._id || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Pet Type</p>
                              <p className="text-muted-foreground">{booking.pet?.petType?.petType || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="therapy" className="mt-4">
                  {booking.physio ? (
                    <div className="space-y-6">
                      {/* Therapy Images */}
                      {booking.physio.imageUrl && booking.physio.imageUrl.length > 0 && (
                        <Card>
                          <CardContent className="pt-6">
                            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                              <ImageIcon className="h-5 w-5 text-primary" />
                              Therapy Images
                            </h3>
                            <Carousel className="w-full">
                              <CarouselContent>
                                {booking.physio.imageUrl.map((image, index) => (
                                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1">
                                      <Card>
                                        <CardContent className="flex aspect-square items-center justify-center p-2">
                                          <img
                                            src={image.url || "/placeholder.svg"}
                                            alt={`${booking.physio.title} - Image ${index + 1}`}
                                            className="w-full h-full object-cover rounded-md"
                                          />
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious />
                              <CarouselNext />
                            </Carousel>
                          </CardContent>
                        </Card>
                      )}

                      {/* Therapy Details */}
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-xl font-bold">{booking.physio.title}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-sm">
                                  {formatCurrency(booking.physio.price)}
                                </Badge>
                                {booking.physio.discountPrice && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 text-sm">
                                    Discounted: {formatCurrency(booking.physio.discountPrice)}
                                  </Badge>
                                )}
                                {booking.physio.offPercentage && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 text-sm">
                                    {booking.physio.offPercentage}% OFF
                                  </Badge>
                                )}
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 text-sm">
                                  Duration: {booking.physio.priceMinute}
                                </Badge>
                                {booking.physio.popular && (
                                  <Badge className="bg-amber-100 text-amber-800 text-sm">Popular</Badge>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium">Description</h4>
                              <p className="text-muted-foreground mt-1">{booking.physio.description}</p>
                            </div>

                            <div>
                              <h4 className="font-medium">Short Description</h4>
                              <p className="text-muted-foreground mt-1">{booking.physio.smallDesc}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No therapy details available for this booking
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full flex items-center gap-2" variant="outline" onClick={() => setStatusOpen(true)}>
                <Tag className="h-4 w-4" />
                Update Status
              </Button>

              {canReschedule && (
                <Button className="w-full flex items-center gap-2" onClick={() => setRescheduleOpen(true)}>
                  <CalendarClock className="h-4 w-4" />
                  Reschedule
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Booking
                </Button>
              )}

              <Button
                variant="destructive"
                className="w-full flex items-center gap-2"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Booking
              </Button>

              <Separator />

              {canReview && (
                <Button className="w-full flex items-center gap-2" onClick={() => setReviewOpen(true)}>
                  <Star className="h-4 w-4" />
                  {booking.rating && booking.rating !== "0" ? "Update Review" : "Add Review"}
                </Button>
              )}

              {/* Payment Status Card */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Status
                </h3>
                <div className="flex items-center mt-2">
                  {booking.paymentComplete ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Payment Complete</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Clock className="h-5 w-5" />
                      <span>Payment Pending</span>
                    </div>
                  )}
                </div>
                <p className="text-sm mt-2">
                  Method: <span className="font-medium">{booking.paymentCollectionType}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">Booking not found</div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Physiotherapy</DialogTitle>
            <DialogDescription>Select a new date and time for the physiotherapy session.</DialogDescription>
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
              Are you sure you want to cancel this physiotherapy booking? This action cannot be undone.
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

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {booking?.rating && booking.rating !== "0" ? "Update Your Review" : "Add Your Review"}
            </DialogTitle>
            <DialogDescription>How would you rate your physiotherapy experience?</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setRatingValue(i + 1)} className="focus:outline-none">
                    <Star
                      className={`h-8 w-8 ${i < ratingValue ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="review">Comments (Optional)</Label>
              <Textarea
                id="review"
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReview} disabled={reviewLoading}>
              {reviewLoading ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>Change the current status of this physiotherapy booking.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={statusLoading}>
              {statusLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SinglePhysio
