
import { useState, useEffect } from "react"
import axios from "axios"
import { format, parseISO } from "date-fns"
import { useLocation, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, MapPin, Cake, User, CreditCard, Truck, Store } from "lucide-react"

const API_URL = "http://localhost:8000/api/v1"

const SingleCakeOrders = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true)
      try {
        // Get the order ID from the URL query parameter
        const searchParams = new URLSearchParams(location.search)
        const orderId = searchParams.get("id")

        if (!orderId) {
          setError("Order ID is missing")
          setLoading(false)
          return
        }

        const response = await axios.get(`${API_URL}/cake-bookings?id=${orderId}`)
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
        <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate("/dashboard/cake-order")}>
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
                <CardDescription>Created on {formatDate(order.createdAt)}</CardDescription>
              </div>
              <Badge className={getStatusBadgeColor(order.bookingStatus)}>{order.bookingStatus}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cake Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Cake size={20} />
                <span>Cake Details</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Design:</span>
                    <span className="font-medium">{order.cakeDesign.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flavor:</span>
                    <span className="font-medium">{order.cakeFlavor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">{order.size.weight}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name on Cake:</span>
                    <span className="font-medium">{order.petNameOnCake}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Same Day Delivery:</span>
                    <span className="font-medium">{order.Same_Day_delivery ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{order.type}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Pet Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User size={20} />
                <span>Pet Details</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pet Name:</span>
                    <span className="font-medium">{order.pet.petname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Breed:</span>
                    <span className="font-medium">{order.pet.petbreed}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span className="font-medium">{formatDate(order.pet.petdob)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner's Number:</span>
                    <span className="font-medium">{order.pet.petOwnertNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Delivery/Pickup Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {order.type === "Delivery" ? (
                  <>
                    <Truck size={20} />
                    <span>Delivery Details</span>
                  </>
                ) : (
                  <>
                    <Store size={20} />
                    <span>Pickup Details</span>
                  </>
                )}
              </h3>

              {order.type === "Delivery" ? (
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
                      <p className="text-muted-foreground">{formatDate(order.deliveredDate)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pl-7">
                  <div className="flex items-start gap-2">
                    <Calendar size={18} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Pickup Date:</p>
                      <p className="text-muted-foreground">{formatDate(order.pickupDate) || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
              <span className="text-muted-foreground">Payment Status:</span>
              <Badge className={order.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {order.isPaid ? "Paid" : "Unpaid"}
              </Badge>
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
                  <span>Discount ({order.couponCode}):</span>
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
            <Button className="w-full" onClick={() => navigate("/dashboard/cake-order")}>
              Back to Orders
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Cake Image */}
      {order.cakeDesign.image && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cake Design</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <img
              src={order.cakeDesign.image.url || "/placeholder.svg"}
              alt={order.cakeDesign.name}
              className="max-h-[300px] object-contain rounded-md"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SingleCakeOrders
