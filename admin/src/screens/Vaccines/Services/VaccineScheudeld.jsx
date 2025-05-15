import { useState, useEffect } from "react"
import axios from "axios"
import { format, isSameDay } from "date-fns"
import { toast } from "sonner"
import { CalendarIcon, Clock, ArrowLeft, CalendarClock, Trash2, CheckCircle, Loader2, Plus, Edit, AlertCircle, Bell, Calendar, Filter, MoreHorizontal } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { API_URL } from "@/constant/Urls"
import { useParams } from "react-router-dom"

// Status configuration with colors and icons
const STATUS_CONFIG = {
  Pending: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Clock className="h-3.5 w-3.5 mr-1" />,
  },
  Confirmed: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
  },
  Completed: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
  },
  Cancelled: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <Trash2 className="h-3.5 w-3.5 mr-1" />,
  },
  "Facing Error": {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
  },
  Rescheduled: {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: <CalendarClock className="h-3.5 w-3.5 mr-1" />,
  },
}

// Status options for dropdown
const STATUS_OPTIONS = ["Pending", "Confirmed", "Completed", "Cancelled", "Facing Error", "Rescheduled"]

export default function VaccineScheduler() {
  // State management
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [activeTab, setActiveTab] = useState("all")

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Form states
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState("09:00")
  const [selectedVaccines, setSelectedVaccines] = useState([])
  const [selectedStatus, setSelectedStatus] = useState("Pending")
  const [selectedNotes, setSelectedNotes] = useState("")

  // Edit/delete item references
  const [currentEditItem, setCurrentEditItem] = useState(null)
  const [currentDeleteItem, setCurrentDeleteItem] = useState(null)

  // Error state
  const [error, setError] = useState(null)

  // Initial data fetching
  useEffect(() => {
    fetchBookingAndSchedule()
  }, [id])

  // Check for today's schedules and show toast
  useEffect(() => {
    if (schedule?.schedule?.length > 0) {
      const todaySchedules = schedule.schedule.filter(item =>
        isSameDay(new Date(item.date), new Date())
      )

      if (todaySchedules.length > 0) {
        toast.info(
          <div className="flex items-start gap-2">
            <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Today's Vaccination Reminder</p>
              <p className="text-sm text-muted-foreground">
                {todaySchedules.length} vaccination{todaySchedules.length > 1 ? 's' : ''} scheduled for today
              </p>
            </div>
          </div>,
          {
            duration: 5000,
            position: "top-right"
          }
        )
      }
    }
  }, [schedule])

  const onBack = () => {
    // Navigation logic here
  }

  // Fetch booking details and schedule
  const fetchBookingAndSchedule = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch booking details
      const bookingResponse = await axios.get(`${API_URL}/single-vaccine-orders?id=${id}`)

      if (!bookingResponse.data.success) {
        throw new Error(bookingResponse.data.message || "Failed to fetch booking details")
      }

      const bookingData = bookingResponse.data.data
      setBooking(bookingData)

      // Fetch schedule if exists
      try {
        const scheduleResponse = await axios.get(`${API_URL}/get-schedule-of-vaccination?id=${id}`)
        if (scheduleResponse.data.success) {
          setSchedule(scheduleResponse.data.data)

          // Set the first vaccine as active tab if available
          if (bookingData?.vaccine?.VaccinedInclueds?.length > 0) {
            setActiveTab("all")
          }
        }
      } catch (scheduleErr) {
        // Schedule might not exist yet, which is okay
        console.log("No schedule found for this booking")
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err.response?.data?.message || err.message || "Failed to fetch vaccination details")
      toast.error("Failed to fetch vaccination details")
    } finally {
      setLoading(false)
    }
  }

  // Handle adding a new schedule
  const handleAddSchedule = async () => {
    try {
      if (selectedVaccines.length === 0) {
        toast.error("Please select at least one vaccine")
        return
      }

      const scheduleData = {
        whichOrderId: id,
        action: "add",
        schedule: [
          {
            date: selectedDate.toISOString(),
            time: selectedTime,
            vaccines: selectedVaccines[0],
            status: selectedStatus,
            notes: selectedNotes,
          },
        ],
      }

      const response = await axios.post(`${API_URL}/add-scheduled`, scheduleData)

      if (response.data.success) {
        toast.success("Vaccination schedule added successfully")
        setShowAddDialog(false)
        fetchBookingAndSchedule()
        resetFormFields()
      } else {
        throw new Error(response.data.message || "Failed to add schedule")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to add schedule")
      console.error(error)
    }
  }

  // Handle updating an existing schedule item
  const handleUpdateSchedule = async () => {
    try {
      if (!currentEditItem) return

      if (selectedVaccines.length === 0) {
        toast.error("Please select at least one vaccine")
        return
      }

      const updateData = {
        whichOrderId: id,
        action: "update",
        scheduleId: schedule._id,
        scheduleItemId: currentEditItem._id,
        updatedScheduleItem: {
          date: selectedDate.toISOString(),
          time: selectedTime,
          vaccines: selectedVaccines,
          status: selectedStatus,
          notes: selectedNotes,
        },
      }

      const response = await axios.post(`${API_URL}/add-scheduled`, updateData)

      if (response.data.success) {
        toast.success("Schedule item updated successfully")
        setShowEditDialog(false)
        fetchBookingAndSchedule()
        resetFormFields()
      } else {
        throw new Error(response.data.message || "Failed to update schedule")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to update schedule")
      console.error(error)
    }
  }

  // Handle deleting a schedule item
  const handleDeleteSchedule = async () => {
    try {
      if (!currentDeleteItem) return

      const deleteData = {
        whichOrderId: id,
        action: "delete",
        scheduleId: schedule._id,
        scheduleItemId: currentDeleteItem._id,
      }

      const response = await axios.post(`${API_URL}/add-scheduled`, deleteData)

      if (response.data.success) {
        toast.success("Schedule item deleted successfully")
        setShowDeleteDialog(false)
        fetchBookingAndSchedule()
      } else {
        throw new Error(response.data.message || "Failed to delete schedule")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to delete schedule")
      console.error(error)
    }
  }

  // Reset form fields
  const resetFormFields = () => {
    setSelectedDate(new Date())
    setSelectedTime("09:00")
    setSelectedVaccines([])
    setSelectedStatus("Pending")
    setSelectedNotes("")
    setCurrentEditItem(null)
    setCurrentDeleteItem(null)
  }

  // Open edit dialog with selected item data
  const openEditDialog = (item) => {
    setCurrentEditItem(item)
    setSelectedDate(new Date(item.date))
    setSelectedTime(item.time || "09:00")
    setSelectedVaccines(item.vaccines || [])
    setSelectedStatus(item.status || "Pending")
    setSelectedNotes(item.notes || "")
    setShowEditDialog(true)
  }

  // Open delete dialog for selected item
  const openDeleteDialog = (item) => {
    setCurrentDeleteItem(item)
    setShowDeleteDialog(true)
  }

  // Handle vaccine selection
  const handleVaccineToggle = (vaccine) => {
    if (selectedVaccines.includes(vaccine)) {
      setSelectedVaccines(selectedVaccines.filter((v) => v !== vaccine))
    } else {
      setSelectedVaccines([...selectedVaccines, vaccine])
    }
  }

  // Filter schedules by vaccine
  const getFilteredSchedules = (vaccineFilter) => {
    if (!schedule || !schedule.schedule || schedule.schedule.length === 0) {
      return []
    }

    if (vaccineFilter === "all") {
      return schedule.schedule
    }

    return schedule.schedule.filter((item) => item.vaccines && item.vaccines.includes(vaccineFilter))
  }

  // Get available vaccines from booking
  const getAvailableVaccines = () => {
    return booking?.vaccine?.VaccinedInclueds || []
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
          <p>Loading vaccination details...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={fetchBookingAndSchedule}>Try Again</Button>
      </div>
    )
  }

  // Get available vaccines
  const availableVaccines = getAvailableVaccines()

  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* Header with back button and status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-2 h-9 w-9 p-0 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-xl font-bold sm:text-2xl">Vaccination Schedule</h1>
        </div>

        <div className="flex items-center gap-3">
          {booking && (
            <Badge
              className={`${booking.status === "Completed"
                  ? "bg-green-100 text-green-800"
                  : booking.status === "Cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                } px-3 py-1 text-sm`}
            >
              {STATUS_CONFIG[booking.status]?.icon}
              {booking.status}
            </Badge>
          )}
          <Button
            onClick={() => setShowAddDialog(true)}
            disabled={booking?.status === "Cancelled" || booking?.status === "Completed"}
            size="sm"
            className="h-9"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Schedule</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Booking details */}
        <div className="lg:col-span-1">
          {booking && (
            <Card className="sticky top-4 border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Booking Details
                </CardTitle>
                <CardDescription>Appointment information</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Booking ID</p>
                      <p className="font-medium text-sm mt-1 truncate">{id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Patient</p>
                      <p className="font-medium text-sm mt-1">{booking.pet?.petname || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Initial Date</p>
                      <p className="font-medium text-sm flex items-center mt-1">
                        <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        {booking.selectedDate ? format(new Date(booking.selectedDate), "MMM d, yyyy") : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Initial Time</p>
                      <p className="font-medium text-sm flex items-center mt-1">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        {booking.selectedTime || "Not set"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="overflow-scroll">
                    <p className="text-xs font-medium text-slate-500 mb-2">Vaccines Included</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableVaccines.length > 0 ? (
                        availableVaccines.map((vaccine, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-blue-50 border-blue-200 text-blue-700 px-2 py-0.5 text-xs"
                          >
                            {vaccine}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm italic text-slate-500">No vaccines specified</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                  disabled={booking?.status === "Cancelled" || booking?.status === "Completed"}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Schedule
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Right column - Schedule management */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <CalendarClock className="h-5 w-5 mr-2 text-primary" />
                  Vaccination Schedule
                </CardTitle>
                <CardDescription>Manage vaccination appointments</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {availableVaccines.length > 0 && schedule?.schedule?.length > 0 ? (
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="px-4 pt-2 sticky top-0 bg-white z-10 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-500">
                        {schedule.schedule.length} Schedule{schedule.schedule.length !== 1 ? "s" : ""}
                      </p>
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-1.5 text-slate-400" />
                        <span className="text-sm">Filter by vaccine:</span>
                      </div>
                    </div>
                    <TabsList className="w-full h-auto flex flex-nowrap overflow-x-auto pb-px mb-2 gap-1">
                      <TabsTrigger value="all" className="flex-shrink-0 text-xs h-8">
                        All Vaccines
                      </TabsTrigger>
                      {availableVaccines.map((vaccine, idx) => (
                        <TabsTrigger key={idx} value={vaccine} className=" text-xs ">
                          {vaccine}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <TabsContent value="all" className="m-0">
                    <ScheduleList
                      schedules={getFilteredSchedules("all")}
                      booking={booking}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                    />
                  </TabsContent>

                  {availableVaccines.map((vaccine, idx) => (
                    <TabsContent key={idx} value={vaccine} className="m-0">
                      <ScheduleList
                        schedules={getFilteredSchedules(vaccine)}
                        booking={booking}
                        onEdit={openEditDialog}
                        onDelete={openDeleteDialog}
                        highlightVaccine={vaccine}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <EmptySchedule
                  onAddSchedule={() => setShowAddDialog(true)}
                  disabled={booking?.status === "Cancelled" || booking?.status === "Completed"}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Schedule Dialog */}
      <ScheduleDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title="Add Vaccination Schedule"
        description="Create a new vaccination schedule for this booking."
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        selectedVaccines={selectedVaccines}
        handleVaccineToggle={handleVaccineToggle}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedNotes={selectedNotes}
        setSelectedNotes={setSelectedNotes}
        availableVaccines={availableVaccines}
        onCancel={() => setShowAddDialog(false)}
        onSubmit={handleAddSchedule}
        submitLabel="Add Schedule"
      />

      {/* Edit Schedule Dialog */}
      <ScheduleDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Vaccination Schedule"
        description="Update the details for this vaccination schedule."
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        selectedVaccines={selectedVaccines}
        handleVaccineToggle={handleVaccineToggle}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedNotes={selectedNotes}
        setSelectedNotes={setSelectedNotes}
        availableVaccines={availableVaccines}
        onCancel={() => setShowEditDialog(false)}
        onSubmit={handleUpdateSchedule}
        submitLabel="Update Schedule"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delete Schedule Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vaccination schedule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {currentDeleteItem && (
            <div className="py-4">
              <Card className="border border-red-100">
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <CalendarClock className="h-5 w-5 mr-2 text-red-600" />
                    <span className="font-medium">
                      {format(new Date(currentDeleteItem.date), "MMMM d, yyyy")} at{" "}
                      {currentDeleteItem.time || "No time specified"}
                    </span>
                  </div>

                  <Badge className={STATUS_CONFIG[currentDeleteItem.status]?.color || "bg-gray-100"}>
                    {STATUS_CONFIG[currentDeleteItem.status]?.icon}
                    {currentDeleteItem.status || "Pending"}
                  </Badge>

                  <div className="mt-3">
                    <p className="text-sm text-slate-600 mb-1">Vaccines:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentDeleteItem.vaccines ? (
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          {currentDeleteItem.vaccines}
                        </Badge>
                      ) : (
                        <span className="text-sm italic text-slate-500">No vaccines specified</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSchedule}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Schedule List Component
function ScheduleList({ schedules, booking, onEdit, onDelete, highlightVaccine }) {
  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <CalendarClock className="h-12 w-12 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Schedules Found</h3>
        <p className="text-slate-500 mb-6 truncate max-w-sm mx-auto">
          {highlightVaccine
            ? `No vaccination schedules have been created for ${highlightVaccine}.`
            : "No vaccination schedules have been created for this booking."}
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-[600px]">
      <div className="space-y-3 p-4">
        {schedules.map((item, index) => (
          <ScheduleCard
            key={index}
            item={item}
            booking={booking}
            onEdit={onEdit}
            onDelete={onDelete}
            highlightVaccine={highlightVaccine}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

// Schedule Card Component
function ScheduleCard({ item, booking, onEdit, onDelete, highlightVaccine }) {
  const isToday = isSameDay(new Date(item.date), new Date())

  return (
    <Card className={`border ${isToday ? 'border-primary/30 bg-primary/5' : 'border-slate-200'} hover:border-slate-300 transition-colors`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarClock className={`h-5 w-5 mr-2 ${isToday ? 'text-primary' : 'text-slate-400'}`} />
              <span className="font-medium text-sm sm:text-base">
                {format(new Date(item.date), "MMM d, yyyy")} at {item.time || "No time"}
              </span>
            </div>

            {isToday && (
              <Badge className="bg-primary text-primary-foreground">
                <Bell className="h-3 w-3 mr-1" />
                Today
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onEdit(item)}
                  disabled={
                    booking?.status === "Cancelled" || booking?.status === "Completed" || item.status === "Completed"
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  disabled={booking?.status === "Cancelled" || booking?.status === "Completed"}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={`${STATUS_CONFIG[item.status]?.color || "bg-gray-100"}`}>
              {STATUS_CONFIG[item.status]?.icon}
              {item.status || "Pending"}
            </Badge>

            <Separator orientation="vertical" className="h-4 mx-1" />

            <span className="text-xs text-slate-500 mr-1.5">Vaccine:</span>
            <div className="flex items-center">
              <p

                className={`${item.vaccines === highlightVaccine
                    ? "bg-blue-100 border-blue-300 text-blue-800"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                  } `}
              >
                {item?.vaccines}
              </p>
            </div>
          </div>

          {item.notes && (
            <div className="mt-1">
              <p className="text-xs text-slate-500 mb-1">Notes:</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                {item.notes}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-1 sm:hidden">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(item)}
              disabled={
                booking?.status === "Cancelled" || booking?.status === "Completed" || item.status === "Completed"
              }
              className="h-8 text-xs"
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
              onClick={() => onDelete(item)}
              disabled={booking?.status === "Cancelled" || booking?.status === "Completed"}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty Schedule Component
function EmptySchedule({ onAddSchedule, disabled }) {
  return (
    <div className="text-center py-12 px-4">
      <CalendarClock className="h-16 w-16 mx-auto text-slate-200 mb-6" />
      <h3 className="text-xl font-medium mb-3">No Schedules Yet</h3>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        No vaccination schedules have been created for this booking. Add your first schedule to get started.
      </p>
      <Button onClick={onAddSchedule} disabled={disabled} size="lg">
        <Plus className="h-4 w-4 mr-2" />
        Create First Schedule
      </Button>
    </div>
  )
}

// Schedule Dialog Component
function ScheduleDialog({
  open,
  onOpenChange,
  title,
  description,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  selectedVaccines,
  handleVaccineToggle,
  selectedStatus,
  setSelectedStatus,
  selectedNotes,
  setSelectedNotes,
  availableVaccines,
  onCancel,
  onSubmit,
  submitLabel,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="border rounded-md p-3"
              />
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center">
                          {STATUS_CONFIG[status]?.icon}
                          <span>{status}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or notes for this vaccination"
                  value={selectedNotes}
                  onChange={(e) => setSelectedNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Select Vaccines</span>
              <span className="text-xs text-slate-500">
                {selectedVaccines.length} of {availableVaccines.length} selected
              </span>
            </Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-slate-50">
              {availableVaccines.length > 0 ? (
                availableVaccines.map((vaccine, idx) => {
                  const isSelected = selectedVaccines.includes(vaccine)

                  return (
                    <Badge
                      key={idx}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${isSelected ? "bg-primary hover:bg-primary/90" : "bg-white hover:bg-slate-100"
                        } px-3 py-1.5`}
                      onClick={() => handleVaccineToggle(vaccine)}
                    >
                      {vaccine}
                      {isSelected && <CheckCircle className="ml-1.5 h-3.5 w-3.5" />}
                    </Badge>
                  )
                })
              ) : (
                <p className="text-sm italic text-slate-500 p-2">No vaccines available</p>
              )}
            </div>
            {selectedVaccines.length === 0 && (
              <p className="text-xs text-red-500">Please select at least one vaccine</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={selectedVaccines.length === 0}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
