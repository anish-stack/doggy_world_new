import { useState } from "react"
import { Link, Route, Routes, Navigate, useLocation } from "react-router-dom"
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Menu,
  LogOut,
  Home,
  ShoppingBag,
  Calendar,
  Tag,
  Cake,
  Stethoscope,
  Scissors,
  Activity,
  Syringe,
  ImageIcon,
  Building,
  UserPlus,
  FileText,
  Dog,
  Cat,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import DashboardHome from "./DashboardHome"
import AllPets from "@/screens/Pets/AllPets"
import PetTypes from "@/screens/Pets/PetTypes"
import DashboardHeader from "@/own_components/DashboardHeader"

const DashboardPage = () => {
  const location = useLocation()
  const [openSections, setOpenSections] = useState({})

  const toggleSection = (title) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  // Define menu structure based on the provided categories
  const menuSections = [
    {
      title: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      singleItem: true,
      to: "/dashboard",
      label: "Overview",
    },
    {
      title: "Orders",
      icon: <ShoppingBag className="h-5 w-5" />,
      items: [
        { to: "/dashboard/pet-shop-order", label: "Pet Shop Order" },
        { to: "/dashboard/bakery-order", label: "Bakery Order" },
        { to: "/dashboard/cake-order", label: "Cake Order" },
      ],
    },
    {
      title: "Bookings",
      icon: <Calendar className="h-5 w-5" />,
      items: [
        { to: "/dashboard/grooming-booking", label: "Grooming Booking" },
        { to: "/dashboard/consultation-booking", label: "Consultation Booking" },
        { to: "/dashboard/vaccination-booking", label: "Vaccination Booking" },
        { to: "/dashboard/lab-test-booking", label: "Lab Test Booking" },
        { to: "/dashboard/physiotherapy-booking", label: "Physiotherapy Booking" },
      ],
    },
    {
      title: "Coupons",
      icon: <Tag className="h-5 w-5" />,
      items: [
        { to: "/dashboard/pet-shop-coupons", label: "Pet Shop Coupons" },
        { to: "/dashboard/vaccination-coupons", label: "Vaccination Coupons" },
        { to: "/dashboard/cake-coupons", label: "Cake Coupons" },
      ],
    },
    {
      title: "Pets",
      icon: <Cat className="h-5 w-5" />,
      items: [
        { to: "/dashboard/all-pets", label: "All Pets" },
        { to: "/dashboard/all-pet-types", label: "Pets Type" }
      ],
    },
    {
      title: "Main Category",
      icon: <Dog className="h-5 w-5" />,
      singleItem: true,
      to: "/dashboard/main-category",
      label: "Main Category",
    },
    {
      title: "Cake Bakery",
      icon: <Cake className="h-5 w-5" />,
      items: [
        { to: "/dashboard/all-design", label: "All Design" },
        { to: "/dashboard/all-flavors", label: "All Flavors" },
        { to: "/dashboard/all-sizes", label: "All Sizes" },
      ],
    },
    {
      title: "Pet Bakery",
      icon: <Cake className="h-5 w-5" />,
      items: [
        { to: "/dashboard/pet-bakery-categories", label: "Pet Bakery Categories" },
        { to: "/dashboard/pet-bakery-products", label: "Pet Baker Products" },
      ],
    },
    {
      title: "Consultations",
      icon: <Stethoscope className="h-5 w-5" />,
      items: [
        { to: "/dashboard/all-consultations", label: "All Consultations" },
        { to: "/dashboard/consultations-doctors", label: "Consultations's Doctors" },
      ],
    },
    {
      title: "Grooming",
      icon: <Scissors className="h-5 w-5" />,
      items: [
        { to: "/dashboard/all-grooming-service", label: "All Grooming Service" },
        { to: "/dashboard/grooming-packages", label: "Grooming Packages" },
      ],
    },
    {
      title: "Physiotherapy",
      icon: <Activity className="h-5 w-5" />,
      singleItem: true,
      to: "/dashboard/physiotherapy",
      label: "Physiotherapy",
    },
    {
      title: "Vaccination",
      icon: <Syringe className="h-5 w-5" />,
      items: [
        { to: "/dashboard/type-of-vaccination-collection", label: "TypeOfVaccinationCollection" },
        { to: "/dashboard/all-vaccination", label: "All Vaccination" },
        { to: "/dashboard/schedule-vaccination", label: "Schedule Vaccination" },
      ],
    },
    {
      title: "Banners",
      icon: <ImageIcon className="h-5 w-5" />,
      items: [
        { to: "/dashboard/home-screen-banners", label: "Home Screen Banners" },
        { to: "/dashboard/service-banners", label: "Service Banners" },
      ],
    },
    {
      title: "Clinic",
      icon: <Building className="h-5 w-5" />,
      items: [
        { to: "/dashboard/all-clinic", label: "All Clinic" },
        { to: "/dashboard/add-new-clinic", label: "Add New Clinic" },
      ],
    },
    {
      title: "Doctors",
      icon: <UserPlus className="h-5 w-5" />,
      singleItem: true,
      to: "/dashboard/doctors",
      label: "Doctors",
    },
    {
      title: "Blogs",
      icon: <FileText className="h-5 w-5" />,
      items: [
        { to: "/dashboard/all-blogs", label: "All Blogs" },
        { to: "/dashboard/create-blogs", label: "Create Blogs" },
      ],
    },
  ]

  const isActive = (path) => location.pathname === path

  // Render a single menu item
  const renderSingleMenuItem = (section) => (
    <Link key={section.to} to={section.to}>
      <Button variant={isActive(section.to) ? "secondary" : "ghost"} className="w-full justify-start gap-2 font-medium">
        {section.icon}
        <span>{section.label}</span>
        {isActive(section.to) && (
          <Badge className="ml-auto h-5 py-0" variant="outline">
            Active
          </Badge>
        )}
      </Button>
    </Link>
  )

  // Render a collapsible menu section
  const renderCollapsibleMenu = (section) => (
    <Collapsible
      key={section.title}
      open={openSections[section.title]}
      onOpenChange={() => toggleSection(section.title)}
      className="w-full"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-medium">
          <div className="flex items-center gap-2">
            {section.icon}
            <span>{section.title}</span>
          </div>
          {openSections[section.title] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 space-y-1">
        {section.items.map(({ to, label }) => (
          <Link key={to} to={to}>
            <Button
              variant={isActive(to) ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start gap-2 font-normal"
            >
              <span>{label}</span>
              {isActive(to) && (
                <Badge className="ml-auto h-5 py-0" variant="outline">
                  Active
                </Badge>
              )}
            </Button>
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 border-r bg-white z-10 overflow-hidden flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          <span className="font-bold text-xl">PetCare Admin</span>
        </div>

        <ScrollArea className="flex-1 px-3 py-2 h-[calc(100vh-9rem)]">
          <div className="space-y-1">
            {menuSections.map((section) =>
              section.singleItem ? renderSingleMenuItem(section) : renderCollapsibleMenu(section),
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/avatars/admin.png" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-gray-500">admin@petcare.com</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:ml-64 w-full">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-indigo-600" />
                    <span>PetCare Admin</span>
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-9rem)]">
                  <div className="px-2 py-2">
                    <div className="space-y-2">
                      {menuSections.map((section) =>
                        section.singleItem ? renderSingleMenuItem(section) : renderCollapsibleMenu(section),
                      )}
                    </div>
                  </div>
                </ScrollArea>
                <div className="p-4 border-t mt-auto">
                  <Button variant="destructive" className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-bold text-lg">PetCare Admin</span>
          </div>

          <Avatar>
            <AvatarImage src="/avatars/admin.png" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </header>

        {/* Desktop header */}
        <div className="hidden lg:block sticky top-0 z-10 bg-white border-b">
          <DashboardHeader />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/all-pets" element={<AllPets />} />
            <Route path="/all-pet-types" element={<PetTypes />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage