import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { format, isToday, parseISO } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:8000/api/v1'

const CakeOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState(null)

  const ordersPerPage = 10

  // Fetch all cake orders
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/all-cake-bookings`)
      if (response.data.success) {
        setOrders(response.data.data)
      } else {
        setError('Failed to fetch orders')
      }
    } catch (err) {
      setError('Error fetching orders: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Update order status
  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return

    try {
      const response = await axios.post(`${API_URL}/chanage-booking-status`, {
        id: selectedOrder._id,
        status: newStatus
      })

      if (response.data.success) {
        // Update the order in the local state
        setOrders(orders.map(order =>
          order._id === selectedOrder._id
            ? { ...order, bookingStatus: newStatus }
            : order
        ))
        setStatusDialogOpen(false)
      } else {
        alert('Failed to update status: ' + response.data.message)
      }
    } catch (err) {
      alert('Error updating status: ' + err.response.data.message)
    }
  }

  // Delete order
  const deleteOrder = async () => {
    if (!orderToDelete) return

    try {
      // Note: This is a placeholder as the delete endpoint wasn't provided
      const response = await axios.delete(`${API_URL}/delete-cake-booking/${orderToDelete._id}`)

      if (response.data.success) {
        setOrders(orders.filter(order => order._id !== orderToDelete._id))
        setDeleteDialogOpen(false)
      } else {
        alert('Failed to delete order: ' + response.data.message)
      }
    } catch (err) {
      alert('Error deleting order: ' + err.message)
    }
  }

  // View order details
  const viewOrderDetails = (orderId) => {
    navigate(`/dashboard/cake-order-view?id=${orderId}`)
  }

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.pet.petname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cakeDesign.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter ? order.bookingStatus === statusFilter : true

      const matchesType = typeFilter === 'all' ? true : order?.type === typeFilter ? true : false


      return matchesSearch && matchesStatus && matchesType
    })
  }, [orders, searchTerm, statusFilter, typeFilter])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      case 'Delivered': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy')
    } catch (error) {
      return 'Invalid Date'
    }
  }

  // Check if delivery is today
  const isDeliveryToday = (dateString) => {
    if (!dateString) return false
    try {
      return isToday(parseISO(dateString))
    } catch (error) {
      return false
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading orders...</div>
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

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl">Cake Orders</CardTitle>
            <p className="text-muted-foreground mt-1">Manage all cake orders</p>
          </div>

        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by order #, pet name, or cake..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Pickup">Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Pet Name</TableHead>
                  <TableHead>Cake</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.pet.petname}</TableCell>
                      <TableCell>{order.cakeDesign.name}</TableCell>
                      <TableCell>{order.type}</TableCell>
                      <TableCell>
                        {order.type === 'Delivery' ? (
                          <div className="flex flex-col">
                            <span>{formatDate(order.deliveredDate)}</span>
                            {isDeliveryToday(order.deliveredDate) && (
                              <Badge className="bg-orange-100 text-orange-800 mt-1 w-fit">Today</Badge>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span>{formatDate(order.pickupDate)}</span>
                            {isDeliveryToday(order.pickupDate) && (
                              <Badge className="bg-orange-100 text-orange-800 mt-1 w-fit">Today</Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(order.bookingStatus)}>
                          {order.bookingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => viewOrderDetails(order._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Dialog open={statusDialogOpen && selectedOrder?._id === order._id} onOpenChange={(open) => {
                            setStatusDialogOpen(open)
                            if (open) {
                              setSelectedOrder(order)
                              setNewStatus(order.bookingStatus)
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Order Status</DialogTitle>
                                <DialogDescription>
                                  Change the status for order {order.orderNumber}
                                </DialogDescription>
                              </DialogHeader>
                              <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                                  <SelectItem value="Pending">Pending</SelectItem>

                                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                                  <SelectItem value="Dispatched">Dispatched</SelectItem>
                                  <SelectItem value="Delivered">Delivered</SelectItem>
                                </SelectContent>
                              </Select>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={updateOrderStatus}>
                                  Update Status
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog open={deleteDialogOpen && orderToDelete?._id === order._id} onOpenChange={(open) => {
                            setDeleteDialogOpen(open)
                            if (open) setOrderToDelete(order)
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete order {order.orderNumber}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={deleteOrder} className="bg-red-500 text-white hover:bg-red-600">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CakeOrders
