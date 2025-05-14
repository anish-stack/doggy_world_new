import { useContext, useState, useEffect } from "react"
import { Link, Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom"
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
  ShoppingCart,
  AlertCircle,
  Microscope
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
import MainCategory from "@/screens/Main Category/MainCategory"
import AllCollectionVaccines from "@/screens/Vaccines/VaccineCats/AllCollectionVaccines"
import AllVaccines from "@/screens/Vaccines/VaccinesPackages/AllVaccines"
import CreateVaccines from "@/screens/Vaccines/VaccinesPackages/CreateVaccines"
import EditVaccines from "@/screens/Vaccines/VaccinesPackages/EditVaccines"
import AllDesign from "@/screens/Cakes/AllDesign"
import AllFlavours from "@/screens/Cakes/flavours/AllFlavours"
import AllSizes from "@/screens/Cakes/Sizes/AllSizes"
import AllBakeryCategories from "@/screens/Bakery/BakeryCategories/AllBakeryCategories"
import AllBakeryProducts from "@/screens/Bakery/Bakery Products/AllBakeryProducts"
import CreateAndEdit from "@/screens/Bakery/Bakery Products/CreateAndEdit"
import AllPhysioTherapy from "@/screens/PhysioTherapy/AllPhysioTherapy"
import CreateAndEditPhysio from "@/screens/PhysioTherapy/CreateAndEditPhysio"
import Coupon from "@/screens/coupons/coupon"
import PetShopCategories from "@/screens/Pet Shop/PetShopCategories/PetShopCategories"
import PetShopSubCategories from "@/screens/Pet Shop/PetShopSubCategories/PetShopSubCategories"
import PetShopProducts from "@/screens/Pet Shop/PetShopProduct/PetShopProducts"
import CreateAndEditProductShop from "@/screens/Pet Shop/PetShopProduct/CreateAndEdit"
import Doctors from "@/screens/Doctors/Doctors"
import AllClinincs from "@/screens/Clinics/AllClinincs"
import CreateAndEditClinc from "@/screens/Clinics/CreateAndEditClinc"
import SignInPage from "./SignInPage"
import AuthContext from "@/context/authContext"
import AccessDenied from "./AccessDenied"
import AllHomeBanners from "@/screens/Banners/HomeBanners/AllHomeBanners"
import CreateAndEditHomeBanner from "@/screens/Banners/HomeBanners/CreateAndEditHomeBanner"
import AllServiceBanners from "@/screens/Banners/ServiceBanners/AllServiceBanners"
import CreateAndEditServiceBanner from "@/screens/Banners/ServiceBanners/CreateAndEditServiceBanner"
import AllBlogs from "@/screens/Blogs/AllBlogs"
import CreateAndEditBlogs from "@/screens/Blogs/CreateAndEditBlogs"
import AllGrooming from "@/screens/Grooming/AllGrooming"
import AllGroomingPackage from "@/screens/Grooming/AllGroomingPackage"
import AllConsultation from "@/screens/consultation/All_consultation"
import AllConultationDoctor from "@/screens/consultation/AllConultationDoctor"
import NotLoggedIn from "./NotLoggedIn"
import AllCollectionLabTest from "@/screens/LabTest/LabCats/AllCollectionLabTest"
import LabTestAll from "@/screens/LabTest/LabTestProducts/LabTestAll"
import CreateLabTest from "@/screens/LabTest/LabTestProducts/CreateLabTest"
import EditLabtest from "@/screens/LabTest/LabTestProducts/EditLabtest"
import Settings from "@/screens/settings/Settings"
import AllLabOrders from "@/Orders/LabOrders/AllLabOrders"


const DashboardPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState({})
  const { user, logout, isAuthenticated } = useContext(AuthContext)

  // Check if user is authenticated
  useEffect(() => {
    console.log("mai login hu", isAuthenticated)

    setTimeout(() => {
      if (!isAuthenticated) {
        console.log("mai redirect ho raha hu")

        navigate("/signin")
      }
    }, 5000)

  }, [])

  const toggleSection = (title) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  // Define access control settings per role
  const roleAccess = {
    admin: {

      all: true,
      restricted: []
    },
    clinic: {
      all: false,

      allowed: [
        "/dashboard",
        "/dashboard/all-pets",
        "/dashboard/all-pet-types",
        "/dashboard/create-physiotherapy",
        "/dashboard/all-vaccination",
        "/dashboard/schedule-vaccination",
        "/dashboard/doctors",
        "/dashboard/pet-shop-order",
        "/dashboard/bakery-order",
        "/dashboard/cake-order",
        "/dashboard/grooming-booking",
        "/dashboard/consultation-booking",
        "/dashboard/vaccination-booking",
        "/dashboard/lab-test-booking",
        "/dashboard/physiotherapy-booking",
        "/dashboard/all-consultations",
        "/dashboard/all-clinic"
      ],

      allowedSections: [
        "Dashboard",
        "Pets",
        "Orders",
        "Bookings",
        "Vaccination",
        "Doctors",
        "Consultations",
        "Clinic"
      ]
    }
  }
  const hasAccess = (path) => {


    if (!isAuthenticated) {

      return false;
    }

    if (user?.role ?  'admin':'admin') {
      return true;
    }

    const clinicAccess = roleAccess.clinic.allowed;
    const isAllowed = clinicAccess.some(route => {
      return path === route;
    });

    return isAllowed;
  };


  // Check if user has access to a section
  const hasSectionAccess = (sectionTitle) => {
    if (!user) return false
    if (user.role === 'admin') return true

    return roleAccess?.clinic?.allowedSections?.includes(sectionTitle)
  }

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
      singleItem: true,
      to: "/dashboard/coupons",
      label: "Coupons",
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
      title: "Pet Shops",
      icon: <ShoppingCart className="h-5 w-5" />,
      items: [
        { to: "/dashboard/type-of-pet-shop", label: "Pet Shop Categories" },
        { to: "/dashboard/type-of-pet-sub-shop", label: "Sub Categories" },
        { to: "/dashboard/pet-shop-product", label: "All Product" }
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
        { to: "/dashboard/pet-bakery-categories", label: " Bakery Categories" },
        { to: "/dashboard/pet-bakery-products", label: "Bakery Products" },
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
      title: "Lab Test",
      icon: <Microscope className="h-5 w-5" />,
      items: [
        { to: "/dashboard/labt-test-type", label: "Lab Test Type" },
        { to: "/dashboard/all-labtest", label: "All LabTest" },

      ],
    },
    {
      title: "Vaccination",
      icon: <Syringe className="h-5 w-5" />,
      items: [
        { to: "/dashboard/type-of-vaccination-collection", label: "Collection Type" },
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
        { to: "/dashboard/all-blogs", label: "All Blogs" }

      ],
    },
  ]

  const isActive = (path) => location.pathname === path

  // Render a single menu item
  const renderSingleMenuItem = (section) => {
    const canAccess = hasAccess(section.to);

    if (!canAccess) return null; // ❌ No access, don't render

    return (
      <div key={section.to} className="relative">
        <Link to={section.to}>
          <Button
            variant={isActive(section.to) ? "secondary" : "ghost"}
            className="w-full justify-start gap-2 font-medium"
          >
            {section.icon}
            <span>{section.label}</span>
            {isActive(section.to) && (
              <Badge className="ml-auto h-5 py-0" variant="outline">
                Active
              </Badge>
            )}
          </Button>
        </Link>
      </div>
    );
  };



  const renderCollapsibleMenu = (section) => {
    const sectionHasAccess = hasSectionAccess(section.title);
    const hasAccessibleItems = section.items.some(item => hasAccess(item.to));

    // ❌ No access at all — skip rendering
    if (!sectionHasAccess && !hasAccessibleItems && user?.role === 'clinic') {
      return null;
    }

    return (
      <Collapsible
        key={section.title}
        open={openSections[section.title]}
        onOpenChange={() => toggleSection(section.title)}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between font-medium"
          >
            <div className="flex items-center gap-2">
              {section.icon}
              <span>{section.title}</span>
            </div>
            {openSections[section.title] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-8 space-y-1">
          {section.items
            .filter(item => hasAccess(item.to)) // ✅ Only render accessible items
            .map(({ to, label }) => (
              <div key={to} className="relative">
                <Link to={to}>
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
              </div>
            ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };


  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/signin");
  }

  // if (!user) {
  //   return <NotLoggedIn />
  // }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 border-r bg-white z-10 overflow-hidden flex-col">
        <div className="p-4 flex items-center gap-2 border-b">
          <span className="font-bold text-md">{user?.role === 'admin' ? 'Doggy World Care Admin' : 'Doggy World Care Clinic'}</span>
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
                <AvatarFallback>{user?.role === 'admin' ? 'AD' : 'CL'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.role === 'admin' ? 'Admin' : 'Clinic'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
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
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
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
                    {user?.role === 'admin' ? 'Admin Dashboard' : 'Clinic Dashboard'}
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
                  <Button onClick={handleLogout} variant="destructive" className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-bold text-lg">{user?.role === 'admin' ? 'Admin Dashboard' : 'Clinic Dashboard'}</span>
          </div>

          <Avatar>
            <AvatarImage src="/avatars/admin.png" />
            <AvatarFallback>{user?.role === 'admin' ? 'AD' : 'CL'}</AvatarFallback>
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

            {/* Pets Routes */}
            <Route path="/all-pets" element={hasAccess("/dashboard/all-pets") ? <AllPets /> : <AccessDenied />} />
            <Route path="/all-pet-types" element={hasAccess("/dashboard/all-pet-types") ? <PetTypes /> : <AccessDenied />} />

            {/* Main Category */}
            <Route path="/main-category" element={hasAccess("/dashboard/main-category") ? <MainCategory /> : <AccessDenied />} />

            {/* Vaccine */}
            <Route path="/type-of-vaccination-collection" element={hasAccess("/dashboard/type-of-vaccination-collection") ? <AllCollectionVaccines /> : <AccessDenied />} />
            <Route path="/all-vaccination" element={hasAccess("/dashboard/all-vaccination") ? <AllVaccines /> : <AccessDenied />} />
            <Route path="/edit-vaccination-product/:id" element={hasAccess("/dashboard/edit-vaccination-product") ? <EditVaccines /> : <AccessDenied />} />
            <Route path="/create-vaccination-product" element={hasAccess("/dashboard/create-vaccination-product") ? <CreateVaccines /> : <AccessDenied />} />

            {/* Cakes design  */}
            <Route path="/all-design" element={hasAccess("/dashboard/all-design") ? <AllDesign /> : <AccessDenied />} />
            <Route path="/all-flavors" element={hasAccess("/dashboard/all-flavors") ? <AllFlavours /> : <AccessDenied />} />
            <Route path="/all-sizes" element={hasAccess("/dashboard/all-sizes") ? <AllSizes /> : <AccessDenied />} />

            {/* Pet Bakery  */}
            <Route path="/pet-bakery-categories" element={hasAccess("/dashboard/pet-bakery-categories") ? <AllBakeryCategories /> : <AccessDenied />} />
            <Route path="/pet-bakery-products" element={hasAccess("/dashboard/pet-bakery-products") ? <AllBakeryProducts /> : <AccessDenied />} />
            <Route path="/create-and-edit-pet-bakery-categories" element={hasAccess("/dashboard/create-and-edit-pet-bakery-categories") ? <CreateAndEdit /> : <AccessDenied />} />

            {/* Physiotherapy */}
            <Route path="/physiotherapy" element={hasAccess("/dashboard/physiotherapy") ? <AllPhysioTherapy /> : <AccessDenied />} />
            <Route path="/create-physiotherapy" element={hasAccess("/dashboard/create-physiotherapy") ? <CreateAndEditPhysio /> : <AccessDenied />} />

            {/* Coupons */}
            <Route path="/coupons" element={hasAccess("/dashboard/coupons") ? <Coupon /> : <AccessDenied />} />

            {/* Pet Shop */}
            <Route path="/type-of-pet-shop" element={hasAccess("/dashboard/type-of-pet-shop") ? <PetShopCategories /> : <AccessDenied />} />
            <Route path="/type-of-pet-sub-shop" element={hasAccess("/dashboard/type-of-pet-sub-shop") ? <PetShopSubCategories /> : <AccessDenied />} />
            <Route path="/pet-shop-product" element={hasAccess("/dashboard/pet-shop-product") ? <PetShopProducts /> : <AccessDenied />} />
            <Route path="/create-and-edit-pet-shop-categories" element={hasAccess("/dashboard/create-and-edit-pet-shop-categories") ? <CreateAndEditProductShop /> : <AccessDenied />} />

            {/* Doctors */}
            <Route path="/doctors" element={hasAccess("/dashboard/doctors") ? <Doctors /> : <AccessDenied />} />

            {/* Clinic */}
            <Route path="/all-clinic" element={hasAccess("/dashboard/all-clinic") ? <AllClinincs /> : <AccessDenied />} />
            <Route path="/add-new-clinic" element={hasAccess("/dashboard/add-new-clinic") ? <CreateAndEditClinc /> : <AccessDenied />} />

            {/* Banners */}
            <Route path="/home-screen-banners" element={hasAccess("/dashboard/home-screen-banners") ? <AllHomeBanners /> : <AccessDenied />} />
            <Route path="/banners/home/edit/:id" element={hasAccess("/dashboard/banners/home/edit/:id") ? <CreateAndEditHomeBanner /> : <AccessDenied />} />
            <Route path="/banners/home/create" element={hasAccess("/dashboard/banners/home/create") ? <CreateAndEditHomeBanner /> : <AccessDenied />} />
            <Route path="/service-banners" element={hasAccess("/dashboard/service-banners") ? <AllServiceBanners /> : <AccessDenied />} />
            <Route path="/service-banners/home/create" element={hasAccess("/dashboard/service-banners/home/create") ? <CreateAndEditServiceBanner /> : <AccessDenied />} />
            <Route path="/service-banners/home/edit/:id" element={hasAccess("/dashboard/service-banners/home/edit/:id") ? <CreateAndEditServiceBanner /> : <AccessDenied />} />

            {/* Blogs */}

            <Route path="/all-blogs" element={hasAccess("/dashboard/all-blogs") ? <AllBlogs /> : <AccessDenied />} />
            <Route path="/blogs/create" element={hasAccess("/dashboard/blogs/create") ? <CreateAndEditBlogs /> : <AccessDenied />} />
            <Route path="/blogs/edit/:id" element={hasAccess("/dashboard/blogs/edit/:id") ? <CreateAndEditBlogs /> : <AccessDenied />} />


            {/* Grooming */}

            <Route path="/all-grooming-service" element={hasAccess("/dashboard/all-grooming-service") ? <AllGrooming /> : <AccessDenied />} />
            <Route path="/grooming-packages" element={hasAccess("/dashboard/grooming-packages") ? <AllGroomingPackage /> : <AccessDenied />} />


            {/* Consultation */}
            <Route path="/all-consultations" element={hasAccess("/dashboard/all-consultations") ? <AllConsultation /> : <AccessDenied />} />
            <Route path="/consultations-doctors" element={hasAccess("/dashboard/consultations-doctors") ? <AllConultationDoctor /> : <AccessDenied />} />

            {/* Lab test */}

            <Route path="/labt-test-type" element={hasAccess("/dashboard/labt-test-type") ? <AllCollectionLabTest /> : <AccessDenied />} />
            <Route path="/all-labtest" element={hasAccess("/dashboard/all-labtest") ? <LabTestAll /> : <AccessDenied />} />
            <Route path="/create-labtest-product" element={hasAccess("/dashboard/create-labtest-product") ? <CreateLabTest /> : <AccessDenied />} />
            <Route path="/edit-labtest-product/:id" element={hasAccess("/dashboard/edit-labtest-product/:id") ? <EditLabtest /> : <AccessDenied />} />

            {/* Settings */}
            <Route path="/settings" element={hasAccess("/dashboard/settings") ? <Settings /> : <AccessDenied />} />



            {/* Lab Orders */}
            <Route path="/lab-test-booking" element={hasAccess("/dashboard/lab-test-booking") ? <AllLabOrders /> : <AccessDenied />} />


            {/* Redirect unknown paths to dashboard home */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage