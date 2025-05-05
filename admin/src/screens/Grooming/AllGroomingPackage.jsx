
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


const AllGroomingPackage = () => {
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPackages, setFilteredPackages] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Form states for create/edit
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    groomingService: "",
    title: "",
    priceStart: 0,
    priceEnd: 0,
    includes: [""],
    isActive: true,
    discount: 0,
  })

  // Fetch all grooming packages and services
  useEffect(() => {
    fetchGroomingPackages()
    fetchGroomingServices()
  }, [refreshTrigger])

  // Filter packages based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPackages(packages)
    } else {
      const filtered = packages.filter(
        (pkg) =>
          pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pkg.groomingService.type.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredPackages(filtered)
    }
  }, [searchTerm, packages])

  const fetchGroomingPackages = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/grooming-service-package`)
      if (response.data.success) {
        setPackages(response.data.data)
        setFilteredPackages(response.data.data)
      } else {
        toast.error("Failed to fetch grooming packages")
      }
    } catch (error) {
      console.error("Error fetching grooming packages:", error)
      toast.error("Error fetching grooming packages")
    } finally {
      setLoading(false)
    }
  }

  const fetchGroomingServices = async () => {
    try {
      const response = await axios.get(`${API_URL}/grooming-service`)
      if (response.data.success) {
        setServices(response.data.data)
      } else {
        toast.error("Failed to fetch grooming services")
      }
    } catch (error) {
      console.error("Error fetching grooming services:", error)
      toast.error("Error fetching grooming services")
    }
  }

  const handleCreatePackage = () => {
    setIsEditing(false)
    setFormData({
      id: "",
      groomingService: "",
      title: "",
      priceStart: 0,
      priceEnd: 0,
      includes: [""],
      isActive: true,
      discount: 0,
    })
    setIsFormDialogOpen(true)
  }

  const handleEditPackage = (pkg) => {
    setIsEditing(true)
    setFormData({
      id: pkg._id,
      groomingService: pkg.groomingService._id,
      title: pkg.title,
      priceStart: pkg.priceStart,
      priceEnd: pkg.priceEnd,
      includes: pkg.includes.length > 0 ? pkg.includes : [""],
      isActive: pkg.isActive,
      discount: pkg.discount,
    })
    setIsFormDialogOpen(true)
  }

  const handleDeleteClick = (pkg) => {
    setPackageToDelete(pkg)
    setIsDeleteDialogOpen(true)
  }

  const handleDeletePackage = async () => {
    if (!packageToDelete) return

    setDeleteLoading(true)
    try {
      const response = await axios.delete(`${API_URL}/grooming-service-package/${packageToDelete._id}`)
      if (response.data.success) {
        toast.success("Grooming package deleted successfully")
        setRefreshTrigger((prev) => prev + 1)
      } else {
        toast.error("Failed to delete grooming package")
      }
    } catch (error) {
      console.error("Error deleting grooming package:", error)
      toast.error("Error deleting grooming package")
    } finally {
      setDeleteLoading(false)
      setIsDeleteDialogOpen(false)
      setPackageToDelete(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: name === "priceStart" || name === "priceEnd" || name === "discount" ? Number(value) : value,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSwitchChange = (name, checked) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleIncludeChange = (index, value) => {
    const newIncludes = [...formData.includes]
    newIncludes[index] = value
    setFormData({
      ...formData,
      includes: newIncludes,
    })
  }

  const addIncludeField = () => {
    setFormData({
      ...formData,
      includes: [...formData.includes, ""],
    })
  }

  const removeIncludeField = (index) => {
    if (formData.includes.length > 1) {
      const newIncludes = [...formData.includes]
      newIncludes.splice(index, 1)
      setFormData({
        ...formData,
        includes: newIncludes,
      })
    }
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setFormLoading(true)

    // Filter out empty includes
    const filteredIncludes = formData.includes.filter((item) => item.trim() !== "")

    try {
      const dataToSend = {
        groomingService: formData.groomingService,
        title: formData.title,
        priceStart: formData.priceStart,
        priceEnd: formData.priceEnd,
        includes: filteredIncludes,
        isActive: formData.isActive,
        discount: formData.discount,
      }

      let response
      if (isEditing) {
        response = await axios.post(`${API_URL}/grooming-service-package/${formData.id}`, dataToSend)
      } else {
        response = await axios.post(`${API_URL}/grooming-service-package`, dataToSend)
      }

      if (response.data.success) {
        toast.success(isEditing ? "Package updated successfully" : "Package created successfully")
        setIsFormDialogOpen(false)
        setRefreshTrigger((prev) => prev + 1)
      } else {
        toast.error(isEditing ? "Failed to update package" : "Failed to create package")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(error.response?.data.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleStatus = async (pkg) => {
    try {
      const response = await axios.post(`${API_URL}/grooming-service-package/${pkg._id}`, {
        ...pkg,
        isActive: !pkg.isActive,
      })

      if (response.data.success) {
        toast.success(`Package ${!pkg.isActive ? "activated" : "deactivated"} successfully`)
        setRefreshTrigger((prev) => prev + 1)
      } else {
        toast.error("Failed to update package status")
      }
    } catch (error) {
      console.error("Error updating package status:", error)
      toast.error(error?.response?.data?.message)
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPackages.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl font-bold">Grooming Packages</CardTitle>
            <CardDescription>Manage all your grooming packages from here</CardDescription>
          </div>
          <Button onClick={handleCreatePackage} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add New Package
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search packages..."
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
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No grooming packages found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Price Range</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Includes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((pkg) => (
                      <TableRow key={pkg._id}>
                        <TableCell className="font-medium">{pkg.title}</TableCell>
                        <TableCell>{pkg.groomingService.type}</TableCell>
                        <TableCell>
                          ₹{pkg.priceStart} - ₹{pkg.priceEnd}
                        </TableCell>
                        <TableCell>
                          {pkg.discount > 0 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {pkg.discount}% Off
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No discount</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {pkg.includes.map((item, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={pkg.isActive ? "default" : "secondary"}
                            className={
                              pkg.isActive
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {pkg.isActive ? (
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
                              <DropdownMenuItem onClick={() => handleEditPackage(pkg)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(pkg)}>
                                {pkg.isActive ? (
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
                                onClick={() => handleDeleteClick(pkg)}
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
              This will permanently delete the grooming package "{packageToDelete?.title}". This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePackage}
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
            <DialogTitle>{isEditing ? "Edit Grooming Package" : "Create New Grooming Package"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of this grooming package"
                : "Fill in the details to create a new grooming package"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitForm}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-right">
                    Package Title <span className="text-red-500">*</span>
                  </Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groomingService" className="text-right">
                    Grooming Service <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.groomingService}
                    onValueChange={(value) => handleSelectChange("groomingService", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service._id} value={service._id}>
                          {service.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceStart" className="text-right">
                    Start Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="priceStart"
                    name="priceStart"
                    type="number"
                    min="0"
                    value={formData.priceStart}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceEnd" className="text-right">
                    End Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="priceEnd"
                    name="priceEnd"
                    type="number"
                    min={formData.priceStart}
                    value={formData.priceEnd}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-right">
                    Discount (%)
                  </Label>
                  <Input
                    id="discount"
                    name="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive" className="text-right">
                      Active Status
                    </Label>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-right">
                    Package Includes <span className="text-red-500">*</span>
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addIncludeField} className="h-8 px-2">
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.includes.map((include, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={include}
                        onChange={(e) => handleIncludeChange(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                        required
                      />
                      {formData.includes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIncludeField(index)}
                          className="h-8 px-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
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
                  "Update Package"
                ) : (
                  "Create Package"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AllGroomingPackage
