
import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { Search, Trash2, Edit, ChevronLeft, ChevronRight, Plus } from "lucide-react"

// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"

const AllPhysioTherapy = () => {

    const navigate = useNavigate()
    const [services, setServices] = useState([])
    const [filteredServices, setFilteredServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [sortBy, setSortBy] = useState("position")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [serviceToDelete, setServiceToDelete] = useState(null)
    const [filterPopular, setFilterPopular] = useState("all")


    const fetchServices = async () => {
        setLoading(true)
        try {
            const response = await axios.get("http://localhost:8000/api/v1/get-physioTherapy")
            if (response.data.success) {
                setServices(response.data.data)
                setFilteredServices(response.data.data)
            } else {
                toast.error("Failed to fetch services")
            }
        } catch (error) {
            console.error("Error fetching services:", error)
            toast.error("Failed to fetch services")
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        fetchServices()
    }, [])


    useEffect(() => {
        let result = [...services]

        // Apply search filter
        if (searchTerm) {
            result = result.filter(
                (service) =>
                    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    service.smallDesc.toLowerCase().includes(searchTerm.toLowerCase()),
            )
        }

        // Apply popularity filter
        if (filterPopular !== "all") {
            const isPopular = filterPopular === "popular"
            result = result.filter((service) => service.popular === isPopular)
        }

        // Apply sorting
        result.sort((a, b) => {
            if (sortBy === "price") return a.price - b.price
            if (sortBy === "title") return a.title.localeCompare(b.title)
            if (sortBy === "discount") return (b.offPercentage || 0) - (a.offPercentage || 0)
            return a.position - b.position // Default sort by position
        })

        setFilteredServices(result)
        setCurrentPage(1) // Reset to first page when filters change
    }, [searchTerm, services, filterPopular, sortBy])

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredServices.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage)

    // Handle delete service
    const handleDeleteService = async () => {
        if (!serviceToDelete) return

        try {
            // This would be the actual API call in a real application
            // await axios.delete(`http://localhost:8000/api/v1/delete-physioTherapy/${serviceToDelete._id}`)

            // For demo purposes, we'll just remove it from the local state
            setServices(services.filter((service) => service._id !== serviceToDelete._id))
            toast.success(`${serviceToDelete.title} has been deleted`)
            setDeleteDialogOpen(false)
            setServiceToDelete(null)
        } catch (error) {
            console.error("Error deleting service:", error)
            toast.error("Failed to delete service")
        }
    }

    const handleEditService = (service) => {
        navigate(`/dashboard/create-physiotherapy?id=${service?._id}`)
    }

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="container mx-auto py-4 px-4">
            <Card className="shadow-lg">
                <div className="flex px-3 items-center justify-between ">
                    <CardHeader className="px-6">
                        <CardTitle className="text-2xl whitespace-nowrap font-bold text-gray-800">
                            Physiotherapy Services
                        </CardTitle>
                    </CardHeader>

                    <Button
                        onClick={() => navigate('/dashboard/create-physiotherapy')}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Physiotherapy  Service
                    </Button>
                </div>


                <CardContent className="p-6">
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search services..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Select value={filterPopular} onValueChange={setFilterPopular}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by popularity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    <SelectItem value="popular">Popular Only</SelectItem>
                                    <SelectItem value="not-popular">Not Popular</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="position">Sort by Position</SelectItem>
                                    <SelectItem value="price">Sort by Price</SelectItem>
                                    <SelectItem value="title">Sort by Name</SelectItem>
                                    <SelectItem value="discount">Sort by Discount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Services Table */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">No services found</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => {
                                    setSearchTerm("")
                                    setFilterPopular("all")
                                    setSortBy("position")
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Image</TableHead>
                                            <TableHead>Service</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentItems.map((service) => (
                                            <TableRow key={service._id}>
                                                <TableCell>
                                                    <div className="h-12 w-12 rounded-md overflow-hidden">
                                                        <img
                                                            src={service.imageUrl[0]?.url || "/placeholder.svg"}
                                                            alt={service.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{service.title}</p>
                                                        <p className="text-sm text-muted-foreground truncate max-w-[250px]">{service.smallDesc}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{service.priceMinute}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-medium">{formatCurrency(service.discountPrice)}</span>
                                                        {service.discountPrice && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-sm line-through text-muted-foreground">
                                                                    {formatCurrency(service.price)}
                                                                </span>
                                                                <Badge variant="destructive" className="text-xs">
                                                                    {service.offPercentage}% OFF
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={service.popular ? "default" : "secondary"}>
                                                        {service.popular ? "Popular" : "Standard"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="icon" onClick={() => handleEditService(service)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => {
                                                                setServiceToDelete(service)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredServices.length)} of{" "}
                                    {filteredServices.length} services
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="icon"
                                            onClick={() => setCurrentPage(page)}
                                            className="w-8 h-8"
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{serviceToDelete?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteService}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AllPhysioTherapy
