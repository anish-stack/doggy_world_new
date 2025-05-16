

import { Link } from "react-router-dom"
import useSWR from "swr"

import {
    Activity,
    Bell,
    ChevronDown,
    ChevronRight,
    LogOut,
    ShoppingCart,
    Stethoscope,
    Syringe,
    TestTube,
    User,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

// Fetcher function for SWR
const fetcher = (...args) => fetch(...args).then((res) => res.json())




const DashboardHeader = ({
    user = null,
    logout = () => {
        console.log("logout")
    },
}) => {
    // Fetch notifications using SWR
    const { data, error, isLoading } = useSWR("http://localhost:8000/api/v1/dashboard-admin", fetcher, {
        refreshInterval: 30000, // Refresh every 30 seconds
    })

    // Get notification details for each category
    const getNotificationDetails = (type) => {
        switch (type) {
            case "cakeBookings":
                return {
                    icon: <ShoppingCart className="h-4 w-4" />,
                    route: "/dashboard/cake-order-view",
                    query: true,
                    label: "Cake Orders",
                    color: "bg-amber-500",
                }
            case "bakeryAndShopBookings":
                return {
                    icon: <ShoppingCart className="h-4 w-4" />,
                    route: "/dashboard/bakery-orders",
                    label: "Bakery Orders",
                    color: "bg-orange-500",
                }
            case "consultations":
                return {
                    icon: <Stethoscope className="h-4 w-4" />,
                    route: "/dashboard/consultations",
                    label: "Consultations",
                    color: "bg-blue-500",
                }
            case "labTests":
                return {
                    icon: <TestTube className="h-4 w-4" />,
                    route: "/dashboard/lab-test-booking",
                    label: "Lab Tests",
                    color: "bg-purple-500",
                }
            case "vaccinations":
                return {
                    icon: <Syringe className="h-4 w-4" />,
                    route: "/dashboard/vaccinations",
                    label: "Vaccinations",
                    color: "bg-green-500",
                }
            case "physioBookings":
                return {
                    icon: <Activity className="h-4 w-4" />,
                    route: "/dashboard/physio",
                    label: "Physiotherapy",
                    color: "bg-cyan-500",
                }
            default:
                return {
                    icon: <Bell className="h-4 w-4" />,
                    route: "/dashboard",
                    label: type,
                    color: "bg-gray-500",
                }
        }
    }

    // Calculate total notifications
    const getTotalNotifications = () => {
        if (!data || !data.newOrders) return 0

        return Object.values(data.newOrders).reduce((total, orders) => {
            return total + (orders?.length || 0)
        }, 0)
    }

    const totalNotifications = getTotalNotifications()

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount)
    }

    // Get user initials for avatar fallback
    const getUserInitials = () => {
        if (!user?.name) return "U"

        const nameParts = user.name.split(" ")
        if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()

        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
    }

    return (
        <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Left side - can be used for breadcrumbs or logo */}
                    <div className="flex items-center">{/* You can add breadcrumbs or other navigation elements here */}</div>

                    {/* Right side - notifications and user profile */}
                    <div className="flex items-center space-x-2">
                        {/* Notifications Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative">
                                    <Bell className="h-5 w-5" />
                                    {totalNotifications > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
                                        >
                                            {totalNotifications > 99 ? "99+" : totalNotifications}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
                                <DropdownMenuLabel className="flex items-center justify-between">
                                    <span>Notifications</span>
                                    {totalNotifications > 0 && <Badge variant="secondary">{totalNotifications} new</Badge>}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {isLoading ? (
                                    <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>
                                ) : error ? (
                                    <div className="p-4 text-center text-destructive">Failed to load notifications</div>
                                ) : (
                                    <>
                                        {data &&
                                            data.newOrders &&
                                            Object.entries(data.newOrders).map(([type, orders]) => {
                                                if (!orders || orders.length === 0) return null

                                                const { icon, route, label, color, query = false } = getNotificationDetails(type)

                                                return (
                                                    <div key={type} className="px-1 py-1">
                                                        <Collapsible className="w-full">
                                                            <CollapsibleTrigger asChild>
                                                                <div className="flex items-center justify-between w-full p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`${color} p-1.5 rounded-md text-white`}>{icon}</div>
                                                                        <span className="font-medium">{label}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="secondary">{orders.length}</Badge>
                                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                    </div>
                                                                </div>
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent>
                                                                <div className="mt-1 space-y-1">
                                                                    {orders.map((order) => (
                                                                        <Link
                                                                            key={order._id}
                                                                            to={
                                                                                label === 'Lab Tests'
                                                                                    ? route
                                                                                    : query
                                                                                        ? `${route}?id=${order._id}`
                                                                                        : `${route}/${order._id}`
                                                                            }
                                                                            className="flex items-center justify-between p-2 pl-9 hover:bg-accent hover:text-accent-foreground rounded-md text-sm"
                                                                        >
                                                                            <span className="truncate">Order #{order._id.slice(-8)}</span>
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                                                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                                            </div>
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            </CollapsibleContent>
                                                        </Collapsible>
                                                        <Separator className="my-1" />
                                                    </div>
                                                )
                                            })}

                                        {totalNotifications === 0 && (
                                            <div className="p-4 text-center text-muted-foreground">No new notifications</div>
                                        )}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 flex items-center gap-2 px-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.picture || "/placeholder.svg"} alt={user?.name || "User"} />
                                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium hidden md:inline-block">{user?.name || "User"}</span>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/dashboard/Profile" className="cursor-pointer flex items-center">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default DashboardHeader
