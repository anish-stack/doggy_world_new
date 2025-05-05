"use client"

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

const AllGrooming = () => {
  const navigate = useNavigate()
  const [groomings, setGroomings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredGroomings, setFilteredGroomings] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Form states for create/edit
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    startPrice: 0,
    endPrice: 0,
    anyOffer: false,
    offer: "",
    priceVary: false,
    bookingAccept: true,
    isActive: true,
    position: 0,
    imageFile: null,
  })
  const [imagePreview, setImagePreview] = useState("")

  // Fetch all grooming services
  useEffect(() => {
    fetchGroomingServices()
  }, [refreshTrigger])

  // Filter groomings based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredGroomings(groomings)
    } else {
      const filtered = groomings.filter(
        (service) =>
          service.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredGroomings(filtered)
    }
  }, [searchTerm, groomings])

  const fetchGroomingServices = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/grooming-service`)
      if (response.data.success) {
        setGroomings(response.data.data)
        setFilteredGroomings(response.data.data)
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
      type: "",
      description: "",
      startPrice: 0,
      endPrice: 0,
      anyOffer: false,
      offer: "",
      priceVary: false,
      bookingAccept: true,
      isActive: true,
      position: groomings.length + 1,
      imageFile: null,
    })
    setImagePreview("")
    setIsFormDialogOpen(true)
  }

  const handleEditService = (service) => {
    setIsEditing(true)
    setFormData({
      id: service._id,
      type: service.type,
      description: service.description,
      startPrice: service.startPrice,
      endPrice: service.endPrice,
      anyOffer: service.anyOffer,
      offer: service.offer || "",
      priceVary: service.priceVary,
      bookingAccept: service.bookingAccept,
      isActive: service.isActive,
      position: service.position,
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
      const response = await axios.delete(`${API_URL}/grooming-service/${serviceToDelete._id}`)
      if (response.data.success) {
        toast.success("Grooming service deleted successfully")
        setRefreshTrigger((prev) => prev + 1)
      } else {
        toast.error("Failed to delete grooming service")
      }
    } catch (error) {
      console.error("Error deleting grooming service:", error)
      toast.error("Error deleting grooming service")
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
          : name === "startPrice" || name === "endPrice" || name === "position"
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
        response = await axios.post(`${API_URL}/grooming-service/${formData.id}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      } else {
        response = await axios.post(`${API_URL}/grooming-service`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      if (response.data.success) {
        toast.success(isEditing ? "Service updated successfully" : "Service created successfully")
        setIsFormDialogOpen(false)
        setRefreshTrigger((prev) => prev + 1)
      } else {
        toast.error(isEditing ? "Failed to update service" : "Failed to create service")
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
      const response = await axios.post(`${API_URL}/grooming-service/${service._id}`, {
        ...service,
        isActive: !service.isActive,
      })

      if (response.data.success) {
        toast.success(`Service ${!service.isActive ? "activated" : "deactivated"} successfully`)
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
  const currentItems = filteredGroomings.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredGroomings.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl font-bold">Grooming Services</CardTitle>
            <CardDescription>Manage all your grooming services from here</CardDescription>
          </div>
          <Button onClick={handleCreateService} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add New Service
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services..."
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
          ) : filteredGroomings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No grooming services found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Position</TableHead>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price Range</TableHead>
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
                              alt={service.type}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{service.type}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {service.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {service.priceVary ? (
                            <span>
                              ₹{service.startPrice} - ₹{service.endPrice}
                            </span>
                          ) : (
                            <span>₹{service.startPrice}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {service.anyOffer ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {service.offer}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No offer</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={service.isActive ? "default" : "secondary"}
                            className={
                              service.isActive
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {service.isActive ? (
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
                                {service.isActive ? (
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
              This will permanently delete the grooming service "{serviceToDelete?.type}". This action cannot be undone.
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
                ? "Update the details of this grooming service"
                : "Fill in the details to create a new grooming service"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitForm}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-right">
                    Service Type <span className="text-red-500">*</span>
                  </Label>
                  <Input id="type" name="type" value={formData.type} onChange={handleInputChange} required />
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
                  <Label htmlFor="startPrice" className="text-right">
                    Start Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startPrice"
                    name="startPrice"
                    type="number"
                    min="0"
                    value={formData.startPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="priceVary" className="text-right">
                      Price Varies
                    </Label>
                    <Switch
                      id="priceVary"
                      name="priceVary"
                      checked={formData.priceVary}
                      onCheckedChange={(checked) => setFormData({ ...formData, priceVary: checked })}
                    />
                  </div>
                  {formData.priceVary && (
                    <Input
                      id="endPrice"
                      name="endPrice"
                      type="number"
                      min={formData.startPrice}
                      value={formData.endPrice}
                      onChange={handleInputChange}
                      placeholder="End Price"
                      required={formData.priceVary}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="anyOffer" className="text-right">
                      Has Offer
                    </Label>
                    <Switch
                      id="anyOffer"
                      name="anyOffer"
                      checked={formData.anyOffer}
                      onCheckedChange={(checked) => setFormData({ ...formData, anyOffer: checked })}
                    />
                  </div>
                  {formData.anyOffer && (
                    <Input
                      id="offer"
                      name="offer"
                      value={formData.offer}
                      onChange={handleInputChange}
                      placeholder="Offer details"
                      required={formData.anyOffer}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bookingAccept" className="text-right">
                      Accept Bookings
                    </Label>
                    <Switch
                      id="bookingAccept"
                      name="bookingAccept"
                      checked={formData.bookingAccept}
                      onCheckedChange={(checked) => setFormData({ ...formData, bookingAccept: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive" className="text-right">
                      Active Status
                    </Label>
                    <Switch
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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

export default AllGrooming
