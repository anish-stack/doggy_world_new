"use client"

import { useState, useEffect } from "react"
import { API_URL, fetcher } from "@/constant/Urls"
import useSWR, { mutate } from "swr"
import axios from "axios"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Plus, Trash, Clock, Calendar, Check } from 'lucide-react'

import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const Settings = () => {
  const { data: settings, error, isLoading, isValidating } = useSWR(`${API_URL}/settings`, fetcher)
  const [activeTab, setActiveTab] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    appName: "",
    supportEmail: "",
    supportNumber: "",
    website: "",
    logo: "",
    appIcon: "",
    version: "",
    imagingTestBookingTimes: {
      start: "08:00",
      end: "18:00",
      gapBetween: 30,
      perGapLimitBooking: 5,
      whichDayBookingClosed: [],
      disabledTimeSlots: []
    },
    vaccinationBookingTimes: {
      start: "08:00",
      end: "18:00",
      gapBetween: 30,
      perGapLimitBooking: 5,
      whichDayBookingClosed: [],
      disabledTimeSlots: []
    },
    labTestBookingTimes: {
      start: "08:00",
      end: "18:00",
      gapBetween: 30,
      perGapLimitBooking: 5,
      whichDayBookingClosed: [],
      disabledTimeSlots: []
    },
    groomingBookingTimes: {
      start: "08:00",
      end: "18:00",
      gapBetween: 30,
      perGapLimitBooking: 5,
      whichDayBookingClosed: [],
      disabledTimeSlots: []
    },
    physiotherapyBookingTimes: {
      start: "08:00",
      end: "18:00",
      gapBetween: 30,
      perGapLimitBooking: 5,
      whichDayBookingClosed: [],
      disabledTimeSlots: []
    }
  })

  // Booking service types for tab navigation
  const bookingTypes = [
    { id: "imagingTest", label: "Imaging Tests", value: "imagingTestBookingTimes" },
    { id: "vaccination", label: "Vaccination", value: "vaccinationBookingTimes" },
    { id: "labTest", label: "Lab Tests", value: "labTestBookingTimes" },
    { id: "grooming", label: "Grooming", value: "groomingBookingTimes" },
    { id: "physiotherapy", label: "Physiotherapy", value: "physiotherapyBookingTimes" }
  ]

  // Days of the week
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  // Set form values when settings are loaded
  useEffect(() => {
    if (settings?.data) {
      // Deep clone the data to avoid reference issues
      const data = JSON.parse(JSON.stringify(settings.data))
      
      // Ensure all booking types have their arrays initialized
      bookingTypes.forEach(type => {
        const bookingType = type.value
        if (data[bookingType]) {
          data[bookingType].whichDayBookingClosed = data[bookingType].whichDayBookingClosed || []
          data[bookingType].disabledTimeSlots = data[bookingType].disabledTimeSlots || []
        }
      })
      
      setFormData(data)
    }
  }, [settings])

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle nested input change
  const handleNestedInputChange = (parentKey, childKey, value) => {
    setFormData(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }))
  }

  // Function to create new settings
  const handleCreateSettings = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await axios.post(`${API_URL}/settings`, data)
      toast.success("Settings created successfully!")
      mutate(`${API_URL}/settings`)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating settings:", error)
      toast.error(error.response?.data?.message || "Failed to create settings")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to update settings
  const handleUpdateSettings = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await axios.put(`${API_URL}/settings`, data)
      toast.success("Settings updated successfully!")
      mutate(`${API_URL}/settings`)
    } catch (error) {
      console.error("Error updating settings:", error)
      toast.error(error.response?.data?.message || "Failed to update settings")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Make a deep copy to ensure all nested objects are properly captured
    const processedData = JSON.parse(JSON.stringify(formData))
    
    // Ensure all booking time settings have proper types
    bookingTypes.forEach(type => {
      const bookingType = type.value
      if (processedData[bookingType]) {
        // Convert string numbers to actual numbers
        processedData[bookingType].gapBetween = Number(processedData[bookingType].gapBetween)
        processedData[bookingType].perGapLimitBooking = Number(processedData[bookingType].perGapLimitBooking)
      }
    })
    
    if (settings) {
      handleUpdateSettings(processedData)
    } else {
      handleCreateSettings(processedData)
    }
  }

  // Reset form to original settings
  const handleReset = () => {
    if (settings?.data) {
      setFormData(settings.data)
    } else {
      // Reset to default values
      setFormData({
        appName: "",
        supportEmail: "",
        supportNumber: "",
        website: "",
        logo: "",
        appIcon: "",
        version: "",
        imagingTestBookingTimes: {
          start: "08:00",
          end: "18:00",
          gapBetween: 30,
          perGapLimitBooking: 5,
          whichDayBookingClosed: [],
          disabledTimeSlots: []
        },
        vaccinationBookingTimes: {
          start: "08:00",
          end: "18:00",
          gapBetween: 30,
          perGapLimitBooking: 5,
          whichDayBookingClosed: [],
          disabledTimeSlots: []
        },
        labTestBookingTimes: {
          start: "08:00",
          end: "18:00",
          gapBetween: 30,
          perGapLimitBooking: 5,
          whichDayBookingClosed: [],
          disabledTimeSlots: []
        },
        groomingBookingTimes: {
          start: "08:00",
          end: "18:00",
          gapBetween: 30,
          perGapLimitBooking: 5,
          whichDayBookingClosed: [],
          disabledTimeSlots: []
        },
        physiotherapyBookingTimes: {
          start: "08:00",
          end: "18:00",
          gapBetween: 30,
          perGapLimitBooking: 5,
          whichDayBookingClosed: [],
          disabledTimeSlots: []
        }
      })
    }
    setIsResetConfirmOpen(false)
    toast.info("Form has been reset")
  }

  // Function to add a disabled time slot
  const addDisabledTimeSlot = (bookingType, type) => {
    const newSlot = type === 'single' 
      ? { type: 'single', time: '12:00' }
      : { type: 'range', start: '12:00', end: '13:00' }
    
    setFormData(prev => {
      const updatedBookingTimes = {
        ...prev[bookingType],
        disabledTimeSlots: [...(prev[bookingType].disabledTimeSlots || []), newSlot]
      }
      
      return {
        ...prev,
        [bookingType]: updatedBookingTimes
      }
    })
  }

  // Function to remove a disabled time slot
  const removeDisabledTimeSlot = (bookingType, index) => {
    setFormData(prev => {
      const updatedSlots = [...prev[bookingType].disabledTimeSlots]
      updatedSlots.splice(index, 1)
      
      return {
        ...prev,
        [bookingType]: {
          ...prev[bookingType],
          disabledTimeSlots: updatedSlots
        }
      }
    })
  }

  // Function to update a disabled time slot
  const updateDisabledTimeSlot = (bookingType, index, field, value) => {
    setFormData(prev => {
      const updatedSlots = [...prev[bookingType].disabledTimeSlots]
      updatedSlots[index] = {
        ...updatedSlots[index],
        [field]: value
      }
      
      return {
        ...prev,
        [bookingType]: {
          ...prev[bookingType],
          disabledTimeSlots: updatedSlots
        }
      }
    })
  }

  // Helper function to toggle day selection
  const toggleDaySelection = (bookingType, day) => {
    setFormData(prev => {
      const currentDays = [...(prev[bookingType].whichDayBookingClosed || [])]
      const dayIndex = currentDays.indexOf(day)
      
      if (dayIndex !== -1) {
        // Remove day if already selected
        currentDays.splice(dayIndex, 1)
      } else {
        // Add day if not selected
        currentDays.push(day)
      }
      
      return {
        ...prev,
        [bookingType]: {
          ...prev[bookingType],
          whichDayBookingClosed: currentDays
        }
      }
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Settings</CardTitle>
            <CardDescription>There was a problem loading the settings. Please try again later.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => mutate(`${API_URL}/settings`)}>Retry</Button>

            {!settings && (
              <Button variant="outline" className="ml-2" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Settings
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Create Settings Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Settings</DialogTitle>
              <DialogDescription>Set up your application settings for the first time.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="appName">Application Name</Label>
                <Input 
                  id="appName"
                  name="appName"
                  placeholder="Doggy World Care" 
                  value={formData.appName}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input 
                    id="supportEmail"
                    name="supportEmail"
                    type="email" 
                    placeholder="support@example.com" 
                    value={formData.supportEmail}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="supportNumber">Support Phone Number</Label>
                  <Input 
                    id="supportNumber"
                    name="supportNumber"
                    placeholder="+1 (555) 123-4567" 
                    value={formData.supportNumber}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input 
                  id="website"
                  name="website"
                  placeholder="https://doggyworldcare.com" 
                  value={formData.website}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Settings
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Application Settings</h1>
        <p className="text-muted-foreground">Configure your application settings and booking time preferences</p>
      </div>

      {!settings?.data && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>No Settings Found</CardTitle>
            <CardDescription>
              It seems there are no settings configured yet. Create new settings to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {settings?.data && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="booking">Booking Settings</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic configuration for your application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="appName">Application Name</Label>
                    <Input 
                      id="appName"
                      name="appName"
                      placeholder="Doggy World Care" 
                      value={formData.appName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      The name that will be displayed throughout the application
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input 
                        id="supportEmail"
                        name="supportEmail"
                        type="email" 
                        placeholder="support@example.com" 
                        value={formData.supportEmail}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="supportNumber">Support Phone Number</Label>
                      <Input 
                        id="supportNumber"
                        name="supportNumber"
                        placeholder="+1 (555) 123-4567" 
                        value={formData.supportNumber}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website URL</Label>
                    <Input 
                      id="website"
                      name="website"
                      placeholder="https://doggyworldcare.com" 
                      value={formData.website}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="version">Application Version</Label>
                    <Input 
                      id="version"
                      name="version"
                      placeholder="1.0.0" 
                      value={formData.version}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Current version of the application
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Booking Settings Tab */}
            <TabsContent value="booking">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Settings</CardTitle>
                  <CardDescription>Configure booking times and availability for different services</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={bookingTypes[0].id} className="w-full">
                    <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-5 w-full">
                      {bookingTypes.map((type) => (
                        <TabsTrigger key={type.id} value={type.id}>
                          {type.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {bookingTypes.map((bookingType) => (
                      <TabsContent key={bookingType.id} value={bookingType.id} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor={`${bookingType.value}-start`}>Start Time</Label>
                            <Input 
                              id={`${bookingType.value}-start`}
                              type="time" 
                              value={formData[bookingType.value]?.start || "08:00"}
                              onChange={(e) => handleNestedInputChange(bookingType.value, "start", e.target.value)}
                              className="mt-1"
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Start time for booking this service
                            </p>
                          </div>

                          <div>
                            <Label htmlFor={`${bookingType.value}-end`}>End Time</Label>
                            <Input 
                              id={`${bookingType.value}-end`}
                              type="time" 
                              value={formData[bookingType.value]?.end || "18:00"}
                              onChange={(e) => handleNestedInputChange(bookingType.value, "end", e.target.value)}
                              className="mt-1"
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              End time for booking this service
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor={`${bookingType.value}-gapBetween`}>Gap Between Bookings (minutes)</Label>
                            <Input 
                              id={`${bookingType.value}-gapBetween`}
                              type="number" 
                              min="0" 
                              value={formData[bookingType.value]?.gapBetween || 30}
                              onChange={(e) => handleNestedInputChange(bookingType.value, "gapBetween", e.target.value)}
                              className="mt-1"
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Time gap between consecutive bookings
                            </p>
                          </div>

                          <div>
                            <Label htmlFor={`${bookingType.value}-perGapLimitBooking`}>Bookings Per Time Slot</Label>
                            <Input 
                              id={`${bookingType.value}-perGapLimitBooking`}
                              type="number" 
                              min="1" 
                              value={formData[bookingType.value]?.perGapLimitBooking || 5}
                              onChange={(e) => handleNestedInputChange(bookingType.value, "perGapLimitBooking", e.target.value)}
                              className="mt-1"
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Maximum bookings allowed per time slot
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label>Closed Days</Label>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => {
                              const isSelected = formData[bookingType.value]?.whichDayBookingClosed?.includes(day) || false
                              
                              return (
                                <Button
                                  key={day}
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className={isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}
                                  onClick={() => toggleDaySelection(bookingType.value, day)}
                                >
                                  {day}
                                  {isSelected && <Check className="ml-2 h-4 w-4" />}
                                </Button>
                              )
                            })}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Select days when this service is not available for booking
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Disabled Time Slots</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => addDisabledTimeSlot(bookingType.value, "single")}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Add Single Time
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => addDisabledTimeSlot(bookingType.value, "range")}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Add Time Range
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {(formData[bookingType.value]?.disabledTimeSlots || []).map((slot, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-3 border rounded-lg shadow-sm hover:border-primary/50 transition-colors"
                              >
                                {slot.type === "single" ? (
                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Type</Label>
                                      <div className="mt-1 flex items-center">
                                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <span>Single Time</span>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Time</Label>
                                      <Input
                                        type="time"
                                        value={slot.time}
                                        className="mt-1"
                                        onChange={(e) => updateDisabledTimeSlot(bookingType.value, index, "time", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Type</Label>
                                      <div className="mt-1 flex items-center">
                                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <span>Time Range</span>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Start Time</Label>
                                      <Input
                                        type="time"
                                        value={slot.start}
                                        className="mt-1"
                                        onChange={(e) => updateDisabledTimeSlot(bookingType.value, index, "start", e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">End Time</Label>
                                      <Input
                                        type="time"
                                        value={slot.end}
                                        className="mt-1"
                                        onChange={(e) => updateDisabledTimeSlot(bookingType.value, index, "end", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                )}

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => removeDisabledTimeSlot(bookingType.value, index)}
                                >
                                  <Trash className="h-5 w-5" />
                                  <span className="sr-only">Remove time slot</span>
                                </Button>
                              </div>
                            ))}

                            {(!formData[bookingType.value]?.disabledTimeSlots ||
                              formData[bookingType.value]?.disabledTimeSlots.length === 0) && (
                              <div className="text-center p-4 border border-dashed rounded">
                                <p className="text-muted-foreground">No disabled time slots configured</p>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Specific times or time ranges when this service is unavailable
                          </p>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Configure your application's visual identity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input 
                      id="logo"
                      name="logo"
                      placeholder="https://example.com/logo.png" 
                      value={formData.logo}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      The logo displayed throughout the application
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="appIcon">App Icon URL</Label>
                    <Input 
                      id="appIcon"
                      name="appIcon"
                      placeholder="https://example.com/icon.png" 
                      value={formData.appIcon}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Icon used for mobile app and favicon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="secondary" onClick={() => setIsResetConfirmOpen(true)}>
              Reset Changes
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </form>
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard all unsaved changes and revert to the last saved settings. Are you sure you want to
              continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Settings Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Settings</DialogTitle>
            <DialogDescription>Set up your application settings for the first time.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="create-appName">Application Name</Label>
              <Input 
                id="create-appName"
                name="appName"
                placeholder="Doggy World Care" 
                value={formData.appName}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-supportEmail">Support Email</Label>
                <Input 
                  id="create-supportEmail"
                  name="supportEmail"
                  type="email" 
                  placeholder="support@example.com" 
                  value={formData.supportEmail}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="create-supportNumber">Support Phone Number</Label>
                <Input 
                  id="create-supportNumber"
                  name="supportNumber"
                  placeholder="+1 (555) 123-4567" 
                  value={formData.supportNumber}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="create-website">Website URL</Label>
              <Input 
                id="create-website"
                name="website"
                placeholder="https://doggyworldcare.com" 
                value={formData.website}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Settings
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Settings
