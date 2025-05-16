
import { useState, useEffect } from "react"
import axios from "axios"
import { format, parseISO } from "date-fns"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, MapPin, User, CreditCard, Truck, ShoppingBag, Clock, FileText } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const API_URL = "http://localhost:8000/api/v1"

const SingleOrderDetails = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
 const {id} = useParams()
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true)
      try {
        // Get the order ID from the URL query parameter
       

        if (!id) {
          setError("Order ID is missing")
          setLoading(false)
          return
        }

        const response = await axios.get(`${API_URL}/booking-details/${id}`)
        if (response.data.success) {
          setOrder(response.data.data)
        } else {
          setError("Failed to fetch order details")
        }
      } catch (err) {
        setError("Error fetching order details: " + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [location.search])

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "MMMM dd, yyyy")
    } catch (error) {
      return "Invalid Date"
    }
  }

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "h:mm a")
    } catch (error) {
      return "Invalid Time"
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      case "Delivered":
        return "bg-blue-100 text-blue-800"
      case "Processing":
        return "bg-purple-100 text-purple-800"
      case "Shipped":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get payment status badge color
  const getPaymentStatusBadgeColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Failed":
        return "bg-red-100 text-red-800"
      case "Refunded":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading order details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Order not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => navigate("/dashboard/pet-shop-order")}
        >
          <ArrowLeft size={16} />
          <span>Back to Orders</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl">Order #{order.orderNumber}</CardTitle>
                <CardDescription>
                  Created on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                </CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pet Details */}
            {order.petId && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User size={20} />
                  <span>Pet Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pet Name:</span>
                      <span className="font-medium">{order.petId.petname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Breed:</span>
                      <span className="font-medium">{order.petId.petbreed}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Owner's Number:</span>
                      <span className="font-medium">{order.petId.petOwnertNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag size={20} />
                <span>Order Items</span>
              </h3>
              <div className="space-y-4 pl-7">
                {order.items.map((item, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 p-4 flex items-center justify-center bg-gray-50">
                        <img
                          src={item.itemId.mainImage?.url || "/placeholder.svg?height=100&width=100"}
                          alt={item.itemId.name}
                          className="h-24 w-24 object-contain"
                        />
                      </div>
                      <div className="md:w-3/4 p-4">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{item.itemId.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.hasVariant ? `${item.variantName}` : ""}
                              {item.itemId.flavour ? ` • ${item.itemId.flavour}` : ""}
                            </p>
                            <Badge variant="outline" className="mb-2">
                              {item.itemModel === "PetShopProduct" ? "Pet Shop" : "Bakery"}
                            </Badge>
                          </div>
                          <div className="text-right mt-2 md:mt-0">
                            <p className="font-semibold">{formatCurrency(item.unitPrice)}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            <p className="font-medium mt-1">Subtotal: {formatCurrency(item.subtotal)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Delivery Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Truck size={20} />
                <span>Delivery Details</span>
              </h3>
              <div className="pl-7 space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Delivery Address:</p>
                    <p className="text-muted-foreground">
                      {order.deliveryInfo.street}, {order.deliveryInfo.city}, {order.deliveryInfo.state} -{" "}
                      {order.deliveryInfo.zipCode}, {order.deliveryInfo.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Delivery Date:</p>
                    <p className="text-muted-foreground">{formatDate(order.deliveryDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status History */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock size={20} />
                <span>Status History</span>
              </h3>
              <div className="pl-7">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="status-history">
                    <AccordionTrigger>View Status Timeline</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 mt-2">
                        {order.statusHistory.map((status, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:justify-between">
                                <p className="font-medium">{status.status}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(status.timestamp)} at {formatTime(status.timestamp)}
                                </p>
                              </div>
                              {status.note && <p className="text-sm mt-1">{status.note}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            {/* Admin Notes */}
            {order.adminNotes && order.adminNotes.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText size={20} />
                    <span>Admin Notes</span>
                  </h3>
                  <div className="pl-7 space-y-2">
                    {order.adminNotes.map((note, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              <span>Payment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status:</span>
              <Badge className={getPaymentStatusBadgeColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
            </div>
            {order.paymentDetails && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment ID:</span>
                  <span
                    className="font-medium text-sm truncate max-w-[150px]"
                    title={order.paymentDetails.razorpay_payment_id || "N/A"}
                  >
                    {order.paymentDetails.razorpay_payment_id || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span
                    className="font-medium text-sm truncate max-w-[150px]"
                    title={order.paymentDetails.razorpay_order_id || "N/A"}
                  >
                    {order.paymentDetails.razorpay_order_id || "N/A"}
                  </span>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.couponApplied && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping:</span>
                <span className="font-medium">{formatCurrency(order.shippingFee)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate("/dashboard/pet-shop-order")}>
              Back to Orders
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default SingleOrderDetails
