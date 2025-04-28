import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CreditCard, DollarSign, Users, ShoppingCart, TrendingUp, TrendingDown } from "lucide-react"

const DashboardHome = () => {
  return (
    <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$45,231.89</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
            <span className="text-emerald-500">+20.1%</span> from last month
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+2,350</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
            <span className="text-emerald-500">+18.2%</span> from last month
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+12,234</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
            <span className="text-rose-500">-2.5%</span> from last month
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+573</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
            <span className="text-emerald-500">+4.3%</span> from last month
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue for the current year</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Chart will be displayed here</div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest 5 orders received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Order #{(Math.random() * 10000).toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Pet Shop Order</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${(Math.random() * 100).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Just now</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Popular Services</CardTitle>
          <CardDescription>Most booked services this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["Grooming", "Vaccination", "Consultation", "Physiotherapy"].map((service, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="font-medium">{service}</div>
                <div className="text-sm">{Math.floor(Math.random() * 100)} bookings</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pet Types</CardTitle>
          <CardDescription>Distribution of pet types</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="text-muted-foreground">Chart will be displayed here</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              "New pet added by Dr. Smith",
              "Appointment rescheduled for Client #1234",
              "New blog post published",
              "Inventory updated for Pet Shop",
              "New coupon created for Vaccinations",
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">{activity}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  )
}

export default DashboardHome