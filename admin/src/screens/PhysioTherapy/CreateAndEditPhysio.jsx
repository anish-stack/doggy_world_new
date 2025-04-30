
import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { X, Loader2, ArrowLeft, ImagePlus } from "lucide-react"

// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

const CreateAndEditPhysio = () => {
  const navigate = useNavigate()

  // Get ID from URL for edit mode
  const getIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("id")
  }

  const id = getIdFromUrl()
  const isEditMode = !!id

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    smallDesc: "",
    description: "",
    price: "",
    priceMinute: "",
    discountPrice: "",
    popular: false,
    position: "",
  })

  // Image state
  const [images, setImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreview, setImagePreview] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [imagesToDelete, setImagesToDelete] = useState([])

  // Loading states
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(isEditMode)

  // Validation errors
  const [errors, setErrors] = useState({})

  // Fetch existing data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchServiceData()
    }
  }, [id])

  const fetchServiceData = async () => {
    setFetchingData(true)
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/get-physioTherapy/${id}`)
      if (response.data.success) {
        const serviceData = response.data.data

        // Set form data
        setFormData({
          title: serviceData.title || "",
          smallDesc: serviceData.smallDesc || "",
          description: serviceData.description || "",
          price: serviceData.price || "",
          priceMinute: serviceData.priceMinute || "",
          discountPrice: serviceData.discountPrice || "",
          popular: serviceData.popular || false,
          position: serviceData.position || "",
        })

        // Set existing images
        if (serviceData.imageUrl && serviceData.imageUrl.length > 0) {
          setExistingImages(serviceData.imageUrl)
        }
      } else {
        toast.error("Failed to fetch service data")
        navigate("/all-physio-therapy")
      }
    } catch (error) {
      console.error("Error fetching service data:", error)
      toast.error("Failed to fetch service data")
      navigate("/all-physio-therapy")
    } finally {
      setFetchingData(false)
    }
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

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Validate file types
    const validFiles = files.filter(
      (file) =>
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp" ||
        file.type === "image/jpg",
    )

    if (validFiles.length !== files.length) {
      toast.error("Only JPG, PNG and WebP images are allowed")
    }

    // Create preview URLs
    const newPreviews = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setImageFiles((prev) => [...prev, ...validFiles])
    setImagePreview((prev) => [...prev, ...newPreviews])

    // Clear validation error for images
    if (errors.images) {
      setErrors({
        ...errors,
        images: null,
      })
    }
  }

  // Remove image from preview
  const removeImage = (index) => {
    const newPreviews = [...imagePreview]
    const newFiles = [...imageFiles]

    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index].preview)

    newPreviews.splice(index, 1)
    newFiles.splice(index, 1)

    setImagePreview(newPreviews)
    setImageFiles(newFiles)
  }

  // Mark existing image for deletion (in edit mode)
  const markImageForDeletion = (publicId, index) => {
    setImagesToDelete((prev) => [...prev, publicId])

    const newExistingImages = [...existingImages]
    newExistingImages.splice(index, 1)
    setExistingImages(newExistingImages)
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.price) {
      newErrors.price = "Price is required"
    } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    if (!formData.position) {
      newErrors.position = "Position is required"
    } else if (isNaN(formData.position) || Number(formData.position) <= 0) {
      newErrors.position = "Position must be a positive number"
    }

    if (
      formData.discountPrice &&
      (isNaN(formData.discountPrice) ||
        Number(formData.discountPrice) <= 0 ||
        Number(formData.discountPrice) >= Number(formData.price))
    ) {
      newErrors.discountPrice = "Discount price must be less than the regular price"
    }

    if (!isEditMode && imageFiles.length === 0) {
      newErrors.images = "At least one image is required"
    } else if (isEditMode && imageFiles.length === 0 && existingImages.length === 0) {
      newErrors.images = "At least one image is required"
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
      // Create FormData object for file upload
      const formDataObj = new FormData()

      // Append form fields
      Object.keys(formData).forEach((key) => {
        formDataObj.append(key, formData[key])
      })

      // Append image files
      imageFiles.forEach((file) => {
        formDataObj.append("images", file)
      })

      // Append image deletion info (for edit mode)
      if (isEditMode && imagesToDelete.length > 0) {
        formDataObj.append("imagesToDelete", JSON.stringify(imagesToDelete))
      }

      let response

      if (isEditMode) {
        // Update existing service
        response = await axios.post(`http://localhost:8000/api/v1/update-physioTherapy/${id}`, formDataObj, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      } else {
        // Create new service
        response = await axios.post("http://localhost:8000/api/v1/create-physioTherapy", formDataObj, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      }

      if (response.data.success) {
        toast.success(isEditMode ? "Service updated successfully" : "Service created successfully")
        navigate("/dashboard/physiotherapy")
      } else {
        toast.error(response.data.message || "Operation failed")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(error.response?.data?.message || "Failed to process your request")
    } finally {
      setLoading(false)
    }
  }

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading service data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=" mx-auto py-8 px-4">
      <Card className="max-w-7xl mx-auto shadow-lg">
        <CardHeader className="bg-card">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/physiotherapy")} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold">
              {isEditMode ? "Edit Physiotherapy Service" : "Create New Physiotherapy Service"}
            </CardTitle>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Hydrotherapy"
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">
                    Position <span className="text-destructive">*</span>
                  </Label>
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
                  <p className="text-xs text-muted-foreground">
                    Position determines the order of display. Lower numbers appear first.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smallDesc">Short Description</Label>
                <Input
                  id="smallDesc"
                  name="smallDesc"
                  value={formData.smallDesc}
                  onChange={handleInputChange}
                  placeholder="Brief description of the service"
                />
                <p className="text-xs text-muted-foreground">
                  A short summary that will appear in service listings (100 characters max)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of the service"
                  rows={4}
                />
              </div>
            </div>

            <Separator />

            {/* Pricing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing Information</h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Regular Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g., 499"
                    min="0"
                    className={errors.price ? "border-destructive" : ""}
                  />
                  {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Discount Price</Label>
                  <Input
                    id="discountPrice"
                    name="discountPrice"
                    type="number"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                    placeholder="e.g., 399"
                    min="0"
                    className={errors.discountPrice ? "border-destructive" : ""}
                  />
                  {errors.discountPrice && <p className="text-sm text-destructive">{errors.discountPrice}</p>}
                  <p className="text-xs text-muted-foreground">Leave empty if there's no discount</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceMinute">Duration</Label>
                  <Input
                    id="priceMinute"
                    name="priceMinute"
                    value={formData.priceMinute}
                    onChange={handleInputChange}
                    placeholder="e.g., 30 min"
                  />
                  <p className="text-xs text-muted-foreground">Duration of the service (e.g., "30 min", "1 hour")</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="popular"
                  name="popular"
                  checked={formData.popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })}
                />
                <Label htmlFor="popular">Mark as Popular</Label>
              </div>
            </div>

            <Separator />

            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Service Images <span className="text-destructive">*</span>
              </h3>

              {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}

              {/* Existing Images (Edit Mode) */}
              {isEditMode && existingImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Images</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={image.public_id} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={`Service image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => markImageForDeletion(image.public_id, index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Image Upload */}
              <div className="space-y-2">
                <Label>Upload New Images</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {/* Image Previews */}
                  {imagePreview.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                        <img
                          src={image.preview || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Upload Button */}
                  <div className="aspect-square flex items-center justify-center border-2 border-dashed rounded-md border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                    <Label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center gap-1 cursor-pointer w-full h-full"
                    >
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-center text-muted-foreground">Click to upload</span>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload JPG, PNG or WebP images. First image will be used as the main image.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-6">
            <Button type="button" variant="outline" onClick={() => navigate("/all-physio-therapy")} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Service" : "Create Service"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default CreateAndEditPhysio
