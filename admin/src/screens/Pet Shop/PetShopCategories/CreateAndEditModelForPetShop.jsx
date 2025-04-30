

import { useState, useEffect } from "react"
import { toast } from "sonner"
import axios from "axios"
import { API_URL } from "@/constant/Urls"
import { Loader2, Upload, X } from "lucide-react"


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const CreateAndEditModelForPetShop = ({ isOpen, onClose, onSuccess, category = null }) => {
  const isEditMode = !!category

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    position: "",
    active: true,
    backgroundColour: "",
  })

  // Image state
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [existingImage, setExistingImage] = useState(null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)

  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Initialize form with category data if in edit mode
  useEffect(() => {
    if (isEditMode && category) {
      setFormData({
        title: category.title || "",
        position: category.position || "",
        active: category.active !== undefined ? category.active : true,
        backgroundColour: category.backgroundColour || "",
      })

      if (category.imageUrl && category.imageUrl.url) {
        setExistingImage({
          url: category.imageUrl.url,
          public_id: category.imageUrl.public_id,
        })
      }
    }
  }, [category, isEditMode])

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
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, or WebP)")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB")
      return
    }

    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveExistingImage(true)

    // Clear validation error for image
    if (errors.image) {
      setErrors({
        ...errors,
        image: null,
      })
    }
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setImage(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview("")
    }

    if (isEditMode) {
      setRemoveExistingImage(true)
    }
  }

  // Keep existing image
  const handleKeepExistingImage = () => {
    setRemoveExistingImage(false)
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.position) {
      newErrors.position = "Position is required"
    } else if (isNaN(formData.position) || Number(formData.position) <= 0) {
      newErrors.position = "Position must be a positive number"
    }

    if (formData.backgroundColour && !formData.backgroundColour.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      newErrors.backgroundColour = "Please enter a valid hex color code (e.g., #FF5733)"
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

      // Append image file if selected
      if (image) {
        formDataObj.append("image", image)
      }

      // Append flag to remove existing image
      if (isEditMode && removeExistingImage && !image) {
        formDataObj.append("removeImage", "true")
      }

      let response

      if (isEditMode) {
        // Update existing category
        response = await axios.put(`${API_URL}/petshop-category/${category._id}`, formDataObj, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      } else {
        // Create new category
        response = await axios.post(`${API_URL}/petshop-category`, formDataObj, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      }

      if (response.data.success) {
        toast.success(isEditMode ? "Category updated successfully" : "Category created successfully")
        onSuccess()
      } else {
        toast.error(response.data.message || "Operation failed")
      }
    } catch (error) {
      console.error("Error submitting form:", error)

      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Handle validation errors from backend
        error.response.data.errors.forEach((err) => toast.error(err))
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Failed to process your request")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Category" : "Create New Category"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of the existing category."
              : "Fill in the details to create a new pet shop category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Dog Food"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Position */}
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

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="backgroundColour">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="backgroundColour"
                name="backgroundColour"
                value={formData.backgroundColour}
                onChange={handleInputChange}
                placeholder="e.g., #FF5733"
                className={errors.backgroundColour ? "border-destructive flex-1" : "flex-1"}
              />
              {formData.backgroundColour && (
                <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: formData.backgroundColour }} />
              )}
            </div>
            {errors.backgroundColour && <p className="text-sm text-destructive">{errors.backgroundColour}</p>}
            <p className="text-xs text-muted-foreground">Optional. Enter a hex color code (e.g., #FF5733)</p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Category Image</Label>

            {/* Existing Image (Edit Mode) */}
            {isEditMode && existingImage && !removeExistingImage && (
              <div className="mb-2">
                <div className="relative inline-block">
                  <img
                    src={existingImage.url || "/placeholder.svg"}
                    alt="Current category image"
                    className="h-32 w-32 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setRemoveExistingImage(true)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Current image</p>
              </div>
            )}

            {/* Show option to keep existing image if user initially chose to remove it */}
            {isEditMode && existingImage && removeExistingImage && !imagePreview && (
              <Button type="button" variant="outline" size="sm" onClick={handleKeepExistingImage} className="mb-2">
                Keep existing image
              </Button>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-2">
                <div className="relative inline-block">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">New image</p>
              </div>
            )}

            {/* Upload Button */}
            {!imagePreview && (isEditMode ? removeExistingImage : true) && (
              <div className="flex items-center justify-center border-2 border-dashed rounded-md border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors p-4">
                <Label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center gap-1 cursor-pointer w-full"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-center text-muted-foreground">Click to upload image</span>
                  <span className="text-xs text-center text-muted-foreground">JPG, PNG or WebP (max 2MB)</span>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </Label>
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              name="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditMode ? "Updating..." : "Creating..."}</span>
                </div>
              ) : isEditMode ? (
                "Update Category"
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateAndEditModelForPetShop
