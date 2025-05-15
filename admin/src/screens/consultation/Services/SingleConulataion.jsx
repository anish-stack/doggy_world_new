import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";

import { Calendar, User, FileText, Star, ArrowLeft, CalendarClock, XCircle, Pill, DollarSign, Clipboard, PawPrint, Clock, CheckCircle, CreditCard } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_URL } from "@/constant/Urls";
import { Input } from "@/components/ui/input";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  Completed: "bg-blue-100 text-blue-800",
  Rescheduled: "bg-purple-100 text-purple-800",
};

const timeSlots = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
];

const SingleConsultation = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reschedule state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Rating state
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingNote, setRatingNote] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);


  //prescription note
  const [prescriptionInfo, setPrescriptionInfo] = useState({
    id: '',
    description: '',
    medicenSuggest: [],
    nextDateForConsultation: '',
    consultationDone: true
  })

  const [newMedicine, setNewMedicine] = useState('');

  const [prescriptionOpen, setPrescriptionOpen] = useState(false);


  // Cancel state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Fetch consultation details
  const fetchConsultation = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/consultations-booking/${id}`);
      setConsultation(response.data.data);

      // Initialize reschedule date if consultation has a date
      if (response.data.data.date) {
        setSelectedDate(new Date(response.data.data.date));
      }

      // Initialize reschedule time if consultation has a time
      if (response.data.data.time) {
        setSelectedTime(response.data.data.time.split(" - ")[0]);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to fetch consultation details");
      toast.error("Failed to fetch consultation details");
      setLoading(false);
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchConsultation();
    }
  }, [id]);




  // Action validations
  const canCancel = consultation?.status === "Confirmed" || consultation?.status === "Rescheduled";
  const canReschedule = consultation?.status === "Confirmed" || consultation?.status === "Rescheduled";
  const canRate = consultation?.status === "Completed" && !consultation?.Rating;

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both date and time");
      return;
    }

    setRescheduleLoading(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      await axios.post(
        `http://localhost:8000/api/v1/consultations-reschedule?id=${id}&date=${formattedDate}&time=${selectedTime}`
      );

      toast.success("Consultation rescheduled successfully");
      setRescheduleOpen(false);
      fetchConsultation(); // Refresh data
    } catch (err) {
      toast.error("Failed to reschedule consultation");
      console.error(err);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleAddPrescription = async () => {
    try {
      setLoading(true);

      if (!id) {
        toast.error("Missing consultation ID.");
        setLoading(false);
        return;
      }

      const payload = {
        id: id,
        description: prescriptionInfo.description,
        medicenSuggest: prescriptionInfo.medicenSuggest,
        nextDateForConsultation: prescriptionInfo.nextDateForConsultation,
        consultationDone: prescriptionInfo.consultationDone,
      };

      const response = await axios.post(
        `${API_URL}/consultations-prescriptions`,
        payload
      );

      if (response.data.success) {
        toast.success("Prescription added successfully!");
        setPrescriptionOpen(false);
        // Optionally refresh the booking/consultation data here
      } else {
        toast.error(response.data.message || "Failed to add prescription.");
      }
    } catch (error) {
      console.error("❌ Error adding prescription:", error);
      toast.error("An error occurred while adding the prescription.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await axios.get(`http://localhost:8000/api/v1/consultations-cancel?id=${id}`);

      toast.success("Consultation cancelled successfully");
      setCancelOpen(false);
      fetchConsultation(); // Refresh data
    } catch (err) {
      toast.error("Failed to cancel consultation");
      console.error(err);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRate = async () => {
    if (!ratingValue) {
      toast.error("Please select a rating");
      return;
    }

    setRatingLoading(true);
    try {
      await axios.post("http://localhost:8000/api/v1/consultations-rate", {
        id,
        number: ratingValue,
        note: ratingNote,
      });

      toast.success("Rating submitted successfully");
      setRatingOpen(false);
      fetchConsultation(); // Refresh data
    } catch (err) {
      toast.error("Failed to submit rating");
      console.error(err);
    } finally {
      setRatingLoading(false);
    }
  };

  const goBack = () => {
    navigate("/dashboard/consultation-booking");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" className="mb-6 flex items-center gap-2" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to Consultations
      </Button>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : consultation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Consultation Info */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold">Consultation Details</CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">ID: {consultation._id}</p>
                    <p className="text-sm text-muted-foreground sm:before:content-['•'] sm:before:mx-2">
                      Ref: {consultation.bookingRef}
                    </p>
                  </div>
                </div>
                <Badge className={statusColors[consultation.status] || "bg-gray-100 text-gray-800"}>
                  {consultation.status || "Unknown"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="pet">Pet Info</TabsTrigger>
                  <TabsTrigger value="prescription">Prescription</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Date & Time
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          {consultation.date ? format(new Date(consultation.date), "MMMM dd, yyyy") : "Not scheduled"}
                          {consultation.time ? ` at ${consultation.time}` : ""}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          Doctor Information
                        </h3>
                        <div className="mt-2 flex items-center gap-3">
                          {consultation.doctorId?.image?.url ? (
                            <Avatar className="h-12 w-12 border">
                              <AvatarImage src={consultation.doctorId.image.url || "/placeholder.svg"} alt={consultation.doctorId.name} />
                              <AvatarFallback>{consultation.doctorId.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{consultation.doctorId?.name || "N/A"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {formatCurrency(consultation.doctorId?.price || 0)}
                              </Badge>
                              {consultation.doctorId?.discount && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                  {formatCurrency(consultation.doctorId.discount)} off
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Consultation Type
                        </h3>
                        <div className="mt-2 space-y-2">
                          <p className="font-medium">{consultation.consultationType?.name || "N/A"}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {formatCurrency(consultation.consultationType?.price || 0)}
                            </Badge>
                            {consultation.consultationType?.discount_price && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                Discounted: {formatCurrency(consultation.consultationType.discount_price)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {consultation.consultationType?.description || "No description available"}
                          </p>
                        </div>
                      </div>
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
                                consultation.paymentComplete
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {consultation.paymentComplete ? "Paid" : "Pending"}
                            </Badge>
                            <Badge variant="outline">{consultation.paymentCollectionType}</Badge>
                          </div>

                          {consultation.paymentDetails && (
                            <div className="mt-3 space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">Amount:</span>{" "}
                                {formatCurrency(parseInt(consultation.paymentDetails.amount) / 100)}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Order ID:</span>{" "}
                                {consultation.paymentDetails.razorpay_order_id}
                              </p>
                              {consultation.paymentDetails.razorpay_payment_id && (
                                <p className="text-sm">
                                  <span className="font-medium">Payment ID:</span>{" "}
                                  {consultation.paymentDetails.razorpay_payment_id}
                                </p>
                              )}
                              <p className="text-sm">
                                <span className="font-medium">Payment Status:</span>{" "}
                                <Badge
                                  className={
                                    consultation.paymentDetails.payment_status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {consultation.paymentDetails.payment_status}
                                </Badge>
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Date:</span>{" "}
                                {format(
                                  new Date(consultation.paymentDetails.createdAt),
                                  "MMM dd, yyyy 'at' hh:mm a"
                                )}
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
                            {format(new Date(consultation.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Last Updated:</span>{" "}
                            {format(new Date(consultation.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}
                          </p>
                          {consultation.cancelledBy && (
                            <p className="text-sm">
                              <span className="font-medium">Cancelled By:</span> {consultation.cancelledBy}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pet" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <PawPrint className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{consultation.pet?.petname || "N/A"}</h3>
                          <p className="text-muted-foreground">{consultation.pet?.petbreed || "Unknown Breed"}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div>
                              <p className="text-sm font-medium">Date of Birth</p>
                              <p className="text-muted-foreground">
                                {consultation.pet?.petdob
                                  ? format(new Date(consultation.pet.petdob), "MMMM dd, yyyy")
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Owner Contact</p>
                              <p className="text-muted-foreground">{consultation.pet?.petOwnertNumber || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Pet ID</p>
                              <p className="text-muted-foreground">{consultation.pet?._id || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="prescription" className="mt-4">
                  {consultation.prescription ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Clipboard className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-medium">Prescription Details</h3>
                          {consultation.prescription.consultationDone && (
                            <Badge className="bg-green-100 text-green-800 ml-auto">Consultation Completed</Badge>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-muted-foreground mt-1">
                              {consultation.prescription.description || "No description provided"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-medium">Recommended Medicines</p>
                            {consultation.prescription.medicenSuggest &&
                              consultation.prescription.medicenSuggest.length > 0 ? (
                              <ul className="mt-2 space-y-2">
                                {consultation.prescription.medicenSuggest.map((medicine, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <Pill className="h-4 w-4 text-primary" />
                                    <span>{medicine}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground mt-1">No medicines suggested</p>
                            )}
                          </div>

                          {consultation.prescription.nextDateForConsultation && (
                            <div>
                              <p className="text-sm font-medium">Next Consultation Date</p>
                              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                {format(
                                  new Date(consultation.prescription.nextDateForConsultation),
                                  "MMMM dd, yyyy"
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No prescription available for this consultation
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
              {canReschedule && (
                <Button
                  className="w-full flex items-center gap-2"
                  onClick={() => setRescheduleOpen(true)}
                >
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
                  Cancel Consultation
                </Button>
              )}

              {(canReschedule || canCancel) && <Separator />}

              {canRate && (
                <Button className="w-full flex items-center gap-2" onClick={() => setRatingOpen(true)}>
                  <Star className="h-4 w-4" />
                  Rate Consultation
                </Button>
              )}

              <Button variant={'secondary'} className="w-full flex items-center gap-2" onClick={() => setPrescriptionOpen(true)}>
                <Star className="h-4 w-4" />
                Add Prescription
              </Button>
              {consultation.Rating && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Your Rating
                  </h3>
                  <div className="flex items-center mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < consultation.Rating.number ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium">{consultation.Rating.number}/5</span>
                  </div>
                  {consultation.Rating.note && <p className="text-sm mt-2">{consultation.Rating.note}</p>}
                </div>
              )}

              {/* Payment Status Card */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Status
                </h3>
                <div className="flex items-center mt-2">
                  {consultation.paymentComplete ? (
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
                  Method: <span className="font-medium">{consultation.paymentCollectionType}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">Consultation not found</div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Consultation</DialogTitle>
            <DialogDescription>Select a new date and time for your consultation.</DialogDescription>
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


      <Dialog open={prescriptionOpen} onOpenChange={setPrescriptionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Prescriptions To Consultation</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Comments (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Share your notes or comments..."
                value={prescriptionInfo.description}
                onChange={(e) =>
                  setPrescriptionInfo((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Next Consultation Date */}
            <div className="grid gap-2">
              <Label htmlFor="nextDate">Next Consultation Date</Label>
              <CalendarComponent
                mode="single"
                selected={prescriptionInfo.nextDateForConsultation}
                onSelect={(date) =>
                  setPrescriptionInfo((prev) => ({
                    ...prev,
                    nextDateForConsultation: date,
                  }))
                }
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>

            {/* Medicine Suggestion Input */}
            <div className="grid gap-2">
              <Label htmlFor="medicine">Medicines</Label>
              <div className="flex gap-2">
                <Input
                  id="medicine"
                  type="text"
                  placeholder="Enter medicine name"
                  value={newMedicine}
                  onChange={(e) => setNewMedicine(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newMedicine.trim() !== "") {
                      setPrescriptionInfo((prev) => ({
                        ...prev,
                        medicenSuggest: [...prev.medicenSuggest, newMedicine],
                      }));
                      setNewMedicine("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <ul className="list-disc pl-5">
                {prescriptionInfo.medicenSuggest.map((med, index) => (
                  <li key={index} className="flex justify-between items-center">
                    {med}
                    <button
                      onClick={() =>
                        setPrescriptionInfo((prev) => ({
                          ...prev,
                          medicenSuggest: prev.medicenSuggest.filter((_, i) => i !== index),
                        }))
                      }
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Consultation Done Switch */}
            <div className="flex items-center gap-2">
              <Label htmlFor="consultationDone">Consultation Completed</Label>
              <input
                id="consultationDone"
                type="checkbox"
                checked={prescriptionInfo.consultationDone}
                onChange={(e) =>
                  setPrescriptionInfo((prev) => ({
                    ...prev,
                    consultationDone: e.target.checked,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrescriptionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPrescription} disabled={loading}>
              {loading ? "Saving..." : "Add Prescription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Rating Dialog */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rate Your Consultation</DialogTitle>
            <DialogDescription>How would you rate your experience with this consultation?</DialogDescription>
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
              <Label htmlFor="note">Comments (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Share your experience..."
                value={ratingNote}
                onChange={(e) => setRatingNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRate} disabled={ratingLoading}>
              {ratingLoading ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Consultation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this consultation? This action cannot be undone.
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
  );
};

export default SingleConsultation;
