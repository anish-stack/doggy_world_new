"use client"

import { useState } from "react"
import useSWR from "swr"
import axios from "axios"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  ArrowUpRight,
  CakeSlice,
  DollarSign,
  Download,
  LayoutDashboard,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Syringe,
  TestTube,
  TrendingUp,
  Users,
  Utensils,
  Stethoscope,
  ActivityIcon,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"

const API_URL = "http://localhost:8000/api/v1"

// Fetcher function for SWR
const fetcher = (url) => axios.get(url).then((res) => res.data)

const DashboardHome = () => {
  const [refreshing, setRefreshing] = useState(false)

  // Fetch dashboard data with SWR
  const { data, error, isLoading, mutate } = useSWR(`${API_URL}/dashboard-admin`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  })

  // Handle refresh/clear cache
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await axios.get(`${API_URL}`)
      await mutate() // Revalidate the data
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Prepare revenue data for chart
  const prepareRevenueData = (data) => {
    if (!data || !data.revenueData) return []

    return [
      {
        name: "Cakes",
        value: Number.parseFloat(data.revenueData.cakeRevenue),
        color: "#8884d8",
        icon: <CakeSlice className="h-4 w-4" />,
      },
      {
        name: "Shop & Bakery",
        value: Number.parseFloat(data.revenueData.bakeryAndShopRevenue),
        color: "#82ca9d",
        icon: <ShoppingBag className="h-4 w-4" />,
      },
      {
        name: "Consultations",
        value: Number.parseFloat(data.revenueData.consultationRevenue),
        color: "#ffc658",
        icon: <Stethoscope className="h-4 w-4" />,
      },
      {
        name: "Lab Tests",
        value: Number.parseFloat(data.revenueData.labTestRevenue),
        color: "#ff8042",
        icon: <TestTube className="h-4 w-4" />,
      },
      {
        name: "Vaccinations",
        value: Number.parseFloat(data.revenueData.vaccinationRevenue),
        color: "#0088fe",
        icon: <Syringe className="h-4 w-4" />,
      },
      {
        name: "Physiotherapy",
        value: Number.parseFloat(data.revenueData.physioRevenue),
        color: "#00C49F",
        icon: <ActivityIcon className="h-4 w-4" />,
      },
    ]
  }

  // Prepare counts data for chart
  const prepareCountsData = (data) => {
    if (!data || !data.counts) return []

    return [
      { name: "Cake Bookings", value: data.counts.cakeBookings, color: "#8884d8" },
      { name: "Shop & Bakery", value: data.counts.bakeryAndShopBookings, color: "#82ca9d" },
      { name: "Consultations", value: data.counts.consultations, color: "#ffc658" },
      { name: "Lab Tests", value: data.counts.labTests, color: "#ff8042" },
      { name: "Vaccinations", value: data.counts.vaccinations, color: "#0088fe" },
      { name: "Physiotherapy", value: data.counts.physioBookings, color: "#00C49F" },
    ]
  }

  // Prepare mock monthly data (since we don't have this in the API)
  const monthlyData = [
    { name: "Jan", revenue: 4000 },
    { name: "Feb", revenue: 3000 },
    { name: "Mar", revenue: 5000 },
    { name: "Apr", revenue: 4500 },
    { name: "May", revenue: 6000 },
    { name: "Jun", revenue: 5500 },
    { name: "Jul", revenue: 7000 },
    { name: "Aug", revenue: 8000 },
    { name: "Sep", revenue: 7500 },
    { name: "Oct", revenue: 9000 },
    { name: "Nov", revenue: 10000 },
    { name: "Dec", revenue: data?.totalRevenue || 11000 },
  ]

  // Get all recent orders combined
  const getAllRecentOrders = (data) => {
    if (!data || !data.recentOrders) return []

    const orders = []

    // Process bakery orders
    if (data.recentOrders.bakeryOrders) {
      data.recentOrders.bakeryOrders.forEach((order) => {
        orders.push({
          id: order._id,
          type: "Bakery & Shop",
          amount: order.totalAmount,
          status: order.status,
          icon: <ShoppingBag className="h-5 w-5 text-amber-500" />,
          color: "bg-amber-100",
        })
      })
    }

    // Process consultations
    if (data.recentOrders.consultations) {
      data.recentOrders.consultations.forEach((order) => {
        orders.push({
          id: order._id,
          type: "Consultation",
          amount: order.paymentDetails?.amount ? Number.parseFloat(order.paymentDetails.amount) / 100 : 0,
          status: order.status,
          icon: <Stethoscope className="h-5 w-5 text-blue-500" />,
          color: "bg-blue-100",
        })
      })
    }

    // Process vaccinations
    if (data.recentOrders.vaccinations) {
      data.recentOrders.vaccinations.forEach((order) => {
        orders.push({
          id: order._id,
          type: "Vaccination",
          amount: order.payment?.amount ? Number.parseFloat(order.payment.amount) / 100 : 0,
          status: order.status,
          icon: <Syringe className="h-5 w-5 text-green-500" />,
          color: "bg-green-100",
        })
      })
    }

    // Process physio bookings
    if (data.recentOrders.physioBookings) {
      data.recentOrders.physioBookings.forEach((order) => {
        orders.push({
          id: order._id,
          type: "Physiotherapy",
          amount: order.paymentDetails?.amount ? Number.parseFloat(order.paymentDetails.amount) / 100 : 0,
          status: order.status,
          icon: <ActivityIcon className="h-5 w-5 text-purple-500" />,
          color: "bg-purple-100",
        })
      })
    }

    // Process lab tests
    if (data.recentOrders.labTests) {
      data.recentOrders.labTests.forEach((order) => {
        orders.push({
          id: order._id,
          type: "Lab Test",
          amount: order.payment?.amount ? Number.parseFloat(order.payment.amount) / 100 : 0,
          status: order.status,
          icon: <TestTube className="h-5 w-5 text-red-500" />,
          color: "bg-red-100",
        })
      })
    }

    // Sort by most recent (using ID as a proxy since we don't have timestamps)
    return orders.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5)
  }

  // Get low stock items
  const getLowStockItems = (data) => {
    if (!data || !data.lowStock) return []

    const items = []

    // Process shop products
    if (data.lowStock.shopProducts) {
      data.lowStock.shopProducts.forEach((product) => {
        if (product.mainStock < 10) {
          items.push({
            id: product._id,
            name: product.name,
            stock: product.mainStock,
            type: "Shop Product",
            icon: <Package className="h-4 w-4 text-orange-500" />,
          })
        }

        // Check variants
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant) => {
            if (variant.stock < 5) {
              items.push({
                id: `${product._id}-${variant._id}`,
                name: `${product.name} (${variant.size})`,
                stock: variant.stock,
                type: "Shop Product Variant",
                icon: <Package className="h-4 w-4 text-orange-500" />,
              })
            }
          })
        }
      })
    }

    // Process bakery products
    if (data.lowStock.bakeryProducts) {
      data.lowStock.bakeryProducts.forEach((product) => {
        if (product.mainStock < 10) {
          items.push({
            id: product._id,
            name: product.name,
            stock: product.mainStock,
            type: "Bakery Product",
            icon: <Utensils className="h-4 w-4 text-pink-500" />,
          })
        }

        // Check variants
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant) => {
            if (variant.stock < 5) {
              items.push({
                id: `${product._id}-${variant._id}`,
                name: `${product.name} (${variant.size})`,
                stock: variant.stock,
                type: "Bakery Product Variant",
                icon: <Utensils className="h-4 w-4 text-pink-500" />,
              })
            }
          })
        }
      })
    }

    return items
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Confirmed":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      case "Rescheduled":
        return "bg-purple-100 text-purple-800"
      case "Delivered":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load dashboard data. Please try refreshing the page.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data?.totalRevenue || 0)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-500">+15.3%</span> from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data
                    ? data.counts.cakeBookings +
                      data.counts.bakeryAndShopBookings +
                      data.counts.consultations +
                      data.counts.labTests +
                      data.counts.vaccinations +
                      data.counts.physioBookings
                    : 0}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="mr-1 h-3 w-3 text-blue-500" />
                  <span className="text-blue-500">+8.2%</span> from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardTitle className="text-sm font-medium">Shop Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.counts.shopProducts || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span className="text-amber-500 font-medium">
                    {getLowStockItems(data).filter((item) => item.type.includes("Shop")).length} low stock items
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-pink-50 to-rose-50">
            <CardTitle className="text-sm font-medium">Bakery Products</CardTitle>
            <CakeSlice className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.counts.bakeryProducts || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span className="text-pink-500 font-medium">
                    {getLowStockItems(data).filter((item) => item.type.includes("Bakery")).length} low stock items
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue trend for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={monthlyData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="url(#colorRevenue)" strokeWidth={2} />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>Revenue by service category</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={prepareRevenueData(data)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {prepareRevenueData(data).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Low Stock */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders across all services</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {getAllRecentOrders(data).map((order) => (
                  <div key={order.id} className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full ${order.color} flex items-center justify-center`}>
                      {order.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Order #{order.id.substring(order.id.length - 6)}</div>
                      <div className="text-sm text-muted-foreground">{order.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(order.amount)}</div>
                      <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6 py-3">
            <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
              <span>Updated {format(new Date(), "MMM d, yyyy")}</span>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : getLowStockItems(data).length > 0 ? (
              <div className="space-y-4">
                {getLowStockItems(data).map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    {item.icon}
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">{item.type}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                          Only {item.stock} left
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No low stock items found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Service Performance</CardTitle>
          <CardDescription>Bookings count by service type</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-[250px] w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={prepareCountsData(data)}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Bookings" radius={[4, 4, 0, 0]}>
                  {prepareCountsData(data).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Popular Services</CardTitle>
            <CardDescription>Most booked services</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {prepareCountsData(data)
                  .sort((a, b) => b.value - a.value)
                  .map((service, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: service.color }}></div>
                        <div className="font-medium">{service.name}</div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{service.value}</span> bookings
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Monthly growth trend</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-[180px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={monthlyData.slice(-6)}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis hide />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <span>Add Product</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                <CakeSlice className="h-6 w-6 text-primary" />
                <span>New Cake</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <span>Customers</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                <span>Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardHome
