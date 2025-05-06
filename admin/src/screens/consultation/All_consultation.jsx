
import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreVertical, Edit, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { API_URL } from "@/constant/Urls"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const AllConsultation = () => {
    const navigate = useNavigate()
    const [consultation, setConsultation] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [serviceToDelete, setServiceToDelete] = useState(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [filteredConsultation, setFilteredConsultation] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // Form states for create/edit
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [formLoading, setFormLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: 0,
        discount_price: 0,
        discount: 0,
        isAnyOffer: false,
        offer_valid_upto_text: "",
        active: true,
        position: 0,
        imageFile: null,
    })
    const [imagePreview, setImagePreview] = useState("")

    // Fetch all consultation services
    useEffect(() => {
        fetchConsultationServices()
    }, [refreshTrigger])

    // Filter consultation based on search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredConsultation(consultation)
        } else {
            const filtered = consultation.filter(
                (service) =>
                    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    service.description.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            setFilteredConsultation(filtered)
        }
    }, [searchTerm, consultation])

    const fetchConsultationServices = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${API_URL}/consultation-types`)
            if (response.data.success) {
                setConsultation(response.data.data)
                setFilteredConsultation(response.data.data)
            } else {
                toast.error("Failed to fetch grooming services")
            }
        } catch (error) {
            console.error("Error fetching grooming services:", error)
            toast.error("Error fetching grooming services")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateService = () => {
        setIsEditing(false)
        setFormData({
            name: "",
            description: "",
            price: 0,
            discount_price: 0,
            discount: 0,
            isAnyOffer: false,
            offer_valid_upto_text: "",
            active: true,
            position: consultation.length + 1,
            imageFile: null,
        })
        setImagePreview("")
        setIsFormDialogOpen(true)
    }

    const handleEditService = (service) => {
        setIsEditing(true)
        setFormData({
            id: service._id,
            name: service?.name,
            description: service?.description,
            price: service?.price,
            discount_price: service?.discount_price,
            discount: service?.discount,
            isAnyOffer: service?.isAnyOffer,
            offer_valid_upto_text: service?.offer_valid_upto_text,
            active: service?.isAnyOffer,
            position: consultation.length + 1,
            imageFile: null,
            existingImageUrl: service.imageUrl?.url,
        })
        setImagePreview(service.imageUrl?.url || "")
        setIsFormDialogOpen(true)
    }

    const handleDeleteClick = (service) => {
        setServiceToDelete(service)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteService = async () => {
        if (!serviceToDelete) return

        setDeleteLoading(true)
        try {
            const response = await axios.delete(`${API_URL}/consultation-types/${serviceToDelete._id}`)
            if (response.data.success) {
                toast.success("consultation service deleted successfully")
                setRefreshTrigger((prev) => prev + 1)
            } else {
                toast.error("Failed to delete consultation service")
            }
        } catch (error) {
            console.error("Error deleting consultation service:", error)
            toast.error("Error deleting consultation service")
        } finally {
            setDeleteLoading(false)
            setIsDeleteDialogOpen(false)
            setServiceToDelete(null)
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormData({ ...formData, imageFile: file })
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]:
                type === "checkbox"
                    ? checked
                    : name === "price" || name === "discount" || name === "position"
                        ? Number(value)
                        : value,
        })
    }

    const handleSubmitForm = async (e) => {
        e.preventDefault()
        setFormLoading(true)

        try {
            const formDataToSend = new FormData()

            // Append all form fields
            Object.keys(formData).forEach((key) => {
                if (key !== "imageFile" && key !== "id" && key !== "existingImageUrl") {
                    formDataToSend.append(key, formData[key])
                }
            })

            // Append image if available
            if (formData.imageFile) {
                formDataToSend.append("image", formData.imageFile)
            }

            let response
            if (isEditing) {
                response = await axios.post(`${API_URL}/consultation-types/${formData.id}`, formDataToSend, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
            } else {
                response = await axios.post(`${API_URL}/consultation-types`, formDataToSend, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
            }

            if (response.data.success) {
                toast.success(isEditing ? "consultation updated successfully" : "consultation created successfully")
                setIsFormDialogOpen(false)
                setRefreshTrigger((prev) => prev + 1)
            } else {
                toast.error(isEditing ? "Failed to update consultation" : "Failed to create consultation")
            }
        } catch (error) {
            console.error("Error submitting form:", error)
            toast.error(error.response.data.message)
        } finally {
            setFormLoading(false)
        }
    }

    const handleToggleStatus = async (service) => {
        try {
            const response = await axios.post(`${API_URL}/consultation-types/${service._id}`, {
                ...service,
                active: !service.active,
            })

            if (response.data.success) {
                toast.success(`consultation  ${!service.active ? "activated" : "deactivated"} successfully`)
                setRefreshTrigger((prev) => prev + 1)
            } else {
                toast.error("Failed to update service status")
            }
        } catch (error) {
            console.error("Error updating service status:", error)
            toast.error("Error updating service status")
        }
    }

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredConsultation.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredConsultation.length / itemsPerPage)

    const paginate = (pageNumber) => setCurrentPage(pageNumber)

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div>
                        <CardTitle className="text-2xl font-bold">All Consultations</CardTitle>
                        <CardDescription>Manage all your Consultations services from here</CardDescription>
                    </div>
                    <Button onClick={handleCreateService} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add New Consultations
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search Consultations..."
                                className="w-full pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRefreshTrigger((prev) => prev + 1)}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredConsultation.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No consultation  services found</p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Position</TableHead>
                                            <TableHead className="w-[80px]">Image</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Discount</TableHead>
                                            <TableHead>Discount Price</TableHead>
                                            <TableHead>Offer</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentItems.map((service) => (
                                            <TableRow key={service._id}>
                                                <TableCell className="font-medium">{service.position}</TableCell>
                                                <TableCell>
                                                    <div className="h-10 w-10 rounded-md overflow-hidden">
                                                        <img
                                                            src={service.imageUrl?.url || "/placeholder.svg?height=40&width=40"}
                                                            alt={service.name}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                e.target.src = "/placeholder.svg?height=40&width=40"
                                                            }}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{service.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {service.description}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{service?.price || 0}</TableCell>
                                                <TableCell className="font-medium">{service?.discount || 0}</TableCell>
                                                <TableCell className="font-medium">{service?.discount_price || 0}</TableCell>

                                                <TableCell>
                                                    {service.isAnyOffer ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                            {service.offer_valid_upto_text}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No offer</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={service.active ? "default" : "secondary"}
                                                        className={
                                                            service.isActive
                                                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                        }
                                                    >
                                                        {service.active ? (
                                                            <span className="flex items-center">
                                                                <CheckCircle className="mr-1 h-3 w-3" /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center">
                                                                <XCircle className="mr-1 h-3 w-3" /> Inactive
                                                            </span>
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Open menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditService(service)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
                                                                {service.active ? (
                                                                    <>
                                                                        <XCircle className="mr-2 h-4 w-4" /> Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(service)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-4 flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>

                                            {Array.from({ length: totalPages }).map((_, index) => {
                                                const pageNumber = index + 1
                                                // Show first page, last page, current page, and pages around current
                                                if (
                                                    pageNumber === 1 ||
                                                    pageNumber === totalPages ||
                                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <PaginationItem key={pageNumber}>
                                                            <PaginationLink
                                                                isActive={pageNumber === currentPage}
                                                                onClick={() => paginate(pageNumber)}
                                                            >
                                                                {pageNumber}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    )
                                                } else if (
                                                    (pageNumber === 2 && currentPage > 3) ||
                                                    (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                                                ) {
                                                    return (
                                                        <PaginationItem key={pageNumber}>
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    )
                                                }
                                                return null
                                            })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the grooming service "{serviceToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteService}
                            disabled={deleteLoading}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {deleteLoading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Create/Edit Form Dialog */}
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Grooming Service" : "Create New Grooming Service"}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Update the details of this Consultation  service"
                                : "Fill in the details to create a new consultation"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitForm}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-right">
                                    Consultation name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position" className="text-right">
                                        Position <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="position"
                                        name="position"
                                        type="number"
                                        min="1"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-right">
                                       Price <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        min="0"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discount" className="text-right">
                                       Discount Percentage <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="discount"
                                        name="discount"
                                        type="number"
                                        min="0"
                                        value={formData.discount}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discount_price" className="text-right">
                                       Discount Price <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="discount_price"
                                        name="discount_price"
                                        type="number"
                                        min="0"
                                        value={formData.discount_price}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                              
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="isAnyOffer" className="text-right">
                                            Has Offer
                                        </Label>
                                        <Switch
                                            id="isAnyOffer"
                                            name="isAnyOffer"
                                            checked={formData.isAnyOffer}
                                            onCheckedChange={(checked) => setFormData({ ...formData, anyOffer: checked })}
                                        />
                                    </div>
                                    {formData.isAnyOffer && (
                                        <Input
                                            id="offer_valid_upto_text"
                                            name="offer_valid_upto_text"
                                            value={formData.offer_valid_upto_text}
                                            onChange={handleInputChange}
                                            placeholder="Offer details"
                                            required={formData.offer_valid_upto_text}
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                  
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="isActive" className="text-right">
                                            Active Status
                                        </Label>
                                        <Switch
                                            id="active"
                                            name="active"
                                            checked={formData.active}
                                            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Service Image</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="cursor-pointer"
                                    />
                                    <div className="border rounded-md overflow-hidden h-24 w-24 flex items-center justify-center">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview || "/placeholder.svg"}
                                                alt="Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-muted-foreground text-sm">No image</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditing ? "Updating..." : "Creating..."}
                                    </>
                                ) : isEditing ? (
                                    "Update Service"
                                ) : (
                                    "Create Service"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AllConsultation

