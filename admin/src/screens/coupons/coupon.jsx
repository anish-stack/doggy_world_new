
import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
  Percent,
  CheckCircle2,
  XCircle,
} from "lucide-react"

// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

const Coupon = () => {
  // State for coupons data
  const [coupons, setCoupons] = useState([])
  const [filteredCoupons, setFilteredCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // State for dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discountPercentage: "",
    discountType: "Percentage",
    min_purchase: "",
    description: "",
    expirationDate: new Date(),
    position: "",
    isActive: true,
    category: "Cakes",
  })

  // Form validation errors
  const [errors, setErrors] = useState({})

  // Fetch all coupons
  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const response = await axios.get("http://localhost:8000/api/v1/get-coupons")
      if (response.data.success) {
        setCoupons(response.data.data || [])
        setFilteredCoupons(response.data.data || [])
      } else {
        toast.error("Failed to fetch coupons")
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching coupons:", error)
      toast.error("Failed to fetch coupons")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchCoupons()
  }, [])

  // Handle search and filtering
  useEffect(() => {
    let result = [...coupons]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (coupon) =>
          coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply category filter
    if (filterCategory !== "all") {
      result = result.filter((coupon) => coupon.category === filterCategory)
    }

    // Apply status filter
    if (filterStatus !== "all") {
      const isActive = filterStatus === "active"
      result = result.filter((coupon) => {
        const isExpired = new Date(coupon.expirationDate) < new Date()
        return isActive ? coupon.isActive && !isExpired : !coupon.isActive || isExpired
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      if (sortBy === "code") {
        comparison = a.code.localeCompare(b.code)
      } else if (sortBy === "discountPercentage") {
        comparison = a.discountPercentage - b.discountPercentage
      } else if (sortBy === "expirationDate") {
        comparison = new Date(a.expirationDate) - new Date(b.expirationDate)
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt) - new Date(b.createdAt)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredCoupons(result)
    setLoading(false)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, coupons, filterCategory, filterStatus, sortBy, sortOrder])

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCoupons.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage)

  // Reset form
  const resetForm = () => {
    setFormData({
      code: "",
      discountPercentage: "",
      discountType: "Percentage",
      min_purchase: "",
      description: "",
      expirationDate: new Date(),
      position: "",
      isActive: true,
      category: "Cakes",
    })
    setErrors({})
  }

  // Open create coupon dialog
  const openCreateDialog = () => {
    resetForm()
    setIsEditMode(false)
    setFormDialogOpen(true)
  }

  // Open edit coupon dialog
  const openEditDialog = async (couponId) => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/get-coupon/${couponId}`)
      if (response.data.success) {
        const couponData = response.data.data
        setFormData({
          code: couponData.code || "",
          discountPercentage: couponData.discountPercentage || "",
          discountType: couponData.discountType || "Percentage",
          min_purchase: couponData.min_purchase || "",
          description: couponData.description || "",
          expirationDate: new Date(couponData.expirationDate) || new Date(),
          position: couponData.position || "",
          isActive: couponData.isActive !== undefined ? couponData.isActive : true,
          category: couponData.category || "Cakes",
        })
        setSelectedCoupon(couponData)
        setIsEditMode(true)
        setFormDialogOpen(true)
        setLoading(false)
      } else {
        toast.error("Failed to fetch coupon details")
      }
    } catch (error) {
        setLoading(false)
      console.error("Error fetching coupon details:", error)
      toast.error("Failed to fetch coupon details")
    } finally {
      setLoading(false)
    }
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (coupon) => {
    setSelectedCoupon(coupon)
    setDeleteDialogOpen(true)
     setLoading(false)
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })

    // Clear validation error when field is updated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear validation error when field is updated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  // Handle date change
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      expirationDate: date,
    })

    // Clear validation error when field is updated
    if (errors.expirationDate) {
      setErrors({
        ...errors,
        expirationDate: null,
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.code.trim()) {
      newErrors.code = "Coupon code is required"
    }

    if (!formData.discountPercentage) {
      newErrors.discountPercentage = "Discount value is required"
    } else if (
      isNaN(formData.discountPercentage) ||
      Number(formData.discountPercentage) < 0 ||
      (formData.discountType === "Percentage" && Number(formData.discountPercentage) > 100)
    ) {
      newErrors.discountPercentage =
        formData.discountType === "Percentage"
          ? "Percentage must be between 0 and 100"
          : "Discount must be a positive number"
    }

    if (formData.min_purchase && (isNaN(formData.min_purchase) || Number(formData.min_purchase) < 0)) {
      newErrors.min_purchase = "Minimum purchase must be a positive number"
    }

    if (formData.position && (isNaN(formData.position) || Number(formData.position) < 0)) {
      newErrors.position = "Position must be a positive number"
    }

    if (!formData.expirationDate) {
      newErrors.expirationDate = "Expiration date is required"
    } else if (new Date(formData.expirationDate) < new Date()) {
      newErrors.expirationDate = "Expiration date cannot be in the past"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)

    try {
      let response
      const payload = {
        ...formData,
        discountPercentage: Number(formData.discountPercentage),
        min_purchase: formData.min_purchase ? Number(formData.min_purchase) : undefined,
        position: formData.position ? Number(formData.position) : undefined,
      }

      if (isEditMode) {
        // Update existing coupon
        response = await axios.put(`http://localhost:8000/api/v1/update-coupon/${selectedCoupon._id}`, payload)
      } else {
        // Create new coupon
        response = await axios.post("http://localhost:8000/api/v1/create-coupon", payload)
      }

      if (response.data.success) {
        toast.success(isEditMode ? "Coupon updated successfully" : "Coupon created successfully")
        setFormDialogOpen(false)
        
        fetchCoupons()
      } else {
        toast.error(response.data.message || "Operation failed")
      }
      setLoading(false)
    } catch (error) {
        setLoading(false)
      console.error("Error submitting form:", error)
      toast.error(error.response?.data?.message || "Failed to process your request")
    } finally {
      setLoading(false)
    }
  }

  // Handle delete coupon
  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return

    setLoading(true)
    try {
      const response = await axios.delete(`http://localhost:8000/api/v1/delete-coupon/${selectedCoupon._id}`)
      if (response.data.success) {
        toast.success("Coupon deleted successfully")
        setDeleteDialogOpen(false)
        fetchCoupons()
      } else {
        toast.error(response.data.message || "Failed to delete coupon")
      }
      setLoading(false)
    } catch (error) {
      console.error("Error deleting coupon:", error)
      toast.error("Failed to delete coupon")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  // Check if coupon is expired
  const isCouponExpired = (expirationDate) => {
    return new Date(expirationDate) < new Date()
  }

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader className="bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-2xl font-bold">Coupon Management</CardTitle>
          <Button onClick={openCreateDialog} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add New Coupon
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Cakes">Cakes</SelectItem>
                  <SelectItem value="Pet Shop">Pet Shop</SelectItem>
                  <SelectItem value="Pet Bakery">Pet Bakery</SelectItem>
                  <SelectItem value="Vaccineations">Vaccinations</SelectItem>
                  <SelectItem value="Lab Test">Lab Test</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive/Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Sort by Created Date</SelectItem>
                  <SelectItem value="code">Sort by Code</SelectItem>
                  <SelectItem value="discountPercentage">Sort by Discount</SelectItem>
                  <SelectItem value="expirationDate">Sort by Expiration</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="w-10"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>

          {/* Coupons Table */}
          {loading  ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No coupons found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm("")
                  setFilterCategory("all")
                  setFilterStatus("all")
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
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Min. Purchase</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((coupon) => (
                      <TableRow key={coupon._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            {coupon.code}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {coupon.discountType === "Percentage" ? (
                              <>
                                <Percent className="h-4 w-4 text-orange-500" />
                                <span>{coupon.discountPercentage}%</span>
                              </>
                            ) : coupon.discountType === "flat" ? (
                              <span>₹{coupon.discountPercentage} off</span>
                            ) : (
                              <span>Free Delivery</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{coupon.discountType}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{coupon.category}</Badge>
                        </TableCell>
                        <TableCell>{coupon.min_purchase ? `₹${coupon.min_purchase}` : "No minimum"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(coupon.expirationDate)}</span>
                          </div>
                          {isCouponExpired(coupon.expirationDate) && (
                            <Badge variant="destructive" className="mt-1">
                              Expired
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {coupon.isActive && !isCouponExpired(coupon.expirationDate) ? (
                            <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                              <XCircle className="h-3 w-3 mr-1" /> Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(coupon._id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(coupon)}>
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCoupons.length)} of{" "}
                    {filteredCoupons.length} coupons
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
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Coupon Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update the details of the existing coupon."
                : "Fill in the details to create a new coupon."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coupon Code */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  Coupon Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., SUMMER25"
                  className={errors.code ? "border-destructive" : ""}
                />
                {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cakes">Cakes</SelectItem>
                    <SelectItem value="Pet Shop">Pet Shop</SelectItem>
                    <SelectItem value="Pet Bakery">Pet Bakery</SelectItem>
                    <SelectItem value="Vaccineations">Vaccinations</SelectItem>
                    <SelectItem value="Lab Test">Lab Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Discount Type */}
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) => handleSelectChange("discountType", value)}
                >
                  <SelectTrigger id="discountType">
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Amount</SelectItem>
                    <SelectItem value="Free Delivery">Free Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discount Value */}
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">
                  {formData.discountType === "Percentage"
                    ? "Discount Percentage"
                    : formData.discountType === "flat"
                      ? "Discount Amount"
                      : "Discount Value"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="discountPercentage"
                    name="discountPercentage"
                    type="number"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    placeholder={formData.discountType === "Percentage" ? "e.g., 25" : "e.g., 500"}
                    className={errors.discountPercentage ? "border-destructive" : ""}
                  />
                  {formData.discountType === "Percentage" && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-muted-foreground">%</span>
                    </div>
                  )}
                  {formData.discountType === "flat" && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-muted-foreground">₹</span>
                    </div>
                  )}
                </div>
                {errors.discountPercentage && <p className="text-sm text-destructive">{errors.discountPercentage}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Minimum Purchase */}
              <div className="space-y-2">
                <Label htmlFor="min_purchase">Minimum Purchase</Label>
                <div className="relative">
                  <Input
                    id="min_purchase"
                    name="min_purchase"
                    type="number"
                    value={formData.min_purchase}
                    onChange={handleInputChange}
                    placeholder="e.g., 1000"
                    className={errors.min_purchase ? "border-destructive" : ""}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-muted-foreground">₹</span>
                  </div>
                </div>
                {errors.min_purchase && <p className="text-sm text-destructive">{errors.min_purchase}</p>}
                <p className="text-xs text-muted-foreground">Leave empty if no minimum purchase required</p>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">Display Position</Label>
                <Input
                  id="position"
                  name="position"
                  type="number"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="e.g., 1"
                  min="1"
                  className={errors.position ? "border-destructive" : ""}
                />
                {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expirationDate">
                Expiration Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      errors.expirationDate ? "border-destructive" : ""
                    }`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.expirationDate ? format(formData.expirationDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.expirationDate}
                    onSelect={handleDateChange}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.expirationDate && <p className="text-sm text-destructive">{errors.expirationDate}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter coupon description"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional description explaining coupon terms and conditions
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Processing...</span>
                  </div>
                ) : isEditMode ? (
                  "Update Coupon"
                ) : (
                  "Create Coupon"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the coupon "{selectedCoupon?.code}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCoupon} disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Deleting...</span>
                </div>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Coupon
