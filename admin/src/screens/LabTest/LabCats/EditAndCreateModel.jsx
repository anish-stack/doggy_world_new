import React, { useState, useEffect } from 'react'
import axios from 'axios'
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, ImagePlus } from 'lucide-react'
import { API_URL } from '@/constant/Urls'

const EditAndCreateModel = ({ isOpen, onClose, vaccine, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    position: 1,
    is_active: true,
    image: null
  })
  const [imagePreview, setImagePreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isEditMode = !!vaccine

  useEffect(() => {
    if (vaccine) {
      setFormData({
        title: vaccine.title || '',
        description: vaccine.description || '',
        position: vaccine.position || 1,
        is_active: vaccine.is_active === undefined ? true : vaccine.is_active,
      })
      
      if (vaccine.image?.url) {
        setImagePreview(vaccine.image.url)
      }
    } else {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        position: 1,
        is_active: true,
        image: null
      })
      setImagePreview('')
    }
  }, [vaccine])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSwitchChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }))
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('position', formData.position)
      formDataToSend.append('is_active', formData.is_active)
      
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      let response;
      
      if (isEditMode) {
        // Update endpoint
        response = await axios.put(
          `${API_URL}/update-LabTest-type/${vaccine._id}`, 
          formDataToSend, 
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
      } else {
        // Create endpoint
        response = await axios.post(
          `${API_URL}/create-LabTest-type`, 
          formDataToSend, 
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
      }

      if (response.data.success) {
        onSuccess()
      } else {
        throw new Error(response.data.message || 'Operation failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save vaccine')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Lab test' : 'Create New Lab test type'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the details of this vaccine type.' 
              : 'Fill in the details to create a new Lab test type.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input 
              id="position"
              name="position"
              type="number"
              min="1"
              value={formData.position}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active Status</Label>
            <Switch 
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={handleSwitchChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Vaccine Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative h-24 w-24 rounded-md overflow-hidden border border-gray-200">
                  <img 
                    src={imagePreview} 
                    alt="Vaccine preview" 
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 w-24 rounded-md bg-gray-100 border border-dashed border-gray-300">
                  <ImagePlus className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <Label htmlFor="image" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </div>
                </Label>
                <Input 
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended size: 512x512 pixels
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update lab Test' : 'Create lab Test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditAndCreateModel