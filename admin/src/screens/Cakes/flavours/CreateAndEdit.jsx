import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { API_URL } from '@/constant/Urls'
import axios from 'axios'
import { X, Upload } from 'lucide-react'

const CreateAndEdit = ({ isOpen, onClose, design, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        isActive: true
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState({})

    // Initialize form data when editing existing flavor
    useEffect(() => {
        if (design) {
            setFormData({
                name: design.name || '',
                isActive: design.isActive !== undefined ? design.isActive : true
            })

            if (design.image && design.image.url) {
                setImagePreview(design.image.url)
            }
        } else {
            // Reset form when creating new
            setFormData({
                name: '',
                isActive: true
            })
            setImagePreview(null)
            setImageFile(null)
        }
    }, [design])

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        })
    }

    // Handle switch toggle for active status
    const handleToggleActive = (checked) => {
        setFormData({
            ...formData,
            isActive: checked
        })
    }

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            // Create a preview URL
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    // Remove selected image
    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(null)
    }

    // Validate form
    const validateForm = () => {
        const newErrors = {}
        if (!formData.name.trim()) {
            newErrors.name = 'Flavor name is required'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsSubmitting(true)

        try {
            const payload = new FormData()
            payload.append('name', formData.name)
            payload.append('isActive', formData.isActive)

            if (imageFile) {
                payload.append('image', imageFile)
            }

            let response

            if (design) {
                // Update existing flavor
                response = await axios.put(`${API_URL}/cake-flavour/${design._id}`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            } else {
                // Create new flavor
                response = await axios.post(`${API_URL}/cake-flavour`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }

            if (response.status === 200 || response.status === 201) {
                onSuccess()
            } else {
                console.error('Error submitting form:', response)
                alert('Failed to save flavor')
            }
        } catch (error) {
            console.error('Error submitting form:', error)
            alert('An error occurred while saving the flavor')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {design ? 'Edit Cake Flavor' : 'Add New Cake Flavor'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Flavor Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter flavor name"
                            className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
  <Label>Flavor Image</Label>
  <div className="border border-dashed border-gray-300 rounded-md p-4">
    {imagePreview ? (
      <div className="relative">
        <img
          src={imagePreview}
          alt="Preview"
          className="h-40 w-40 object-cover mx-auto rounded-md"
        />
        <button
          type="button"
          onClick={handleRemoveImage}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <div className="text-center">
        <label className="cursor-pointer">
          <div className="flex flex-col items-center justify-center py-6">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              Click to upload 
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WEBP up to 5MB
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      </div>
    )}
  </div>
</div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="isActive">Active Status</Label>
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={handleToggleActive}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSubmitting ? 'Saving...' : design ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateAndEdit