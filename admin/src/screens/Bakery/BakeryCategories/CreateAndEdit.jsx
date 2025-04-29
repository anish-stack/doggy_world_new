import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { API_URL } from '@/constant/Urls';
import axios from 'axios';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';

const CreateAndEdit = ({ isOpen, onClose, design, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
  
    tag: '',
    active: true,
    position: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when editing existing entry
  useEffect(() => {
    if (design) {
      setFormData({
        title: design?.title || '',
      
        tag: design?.tag || '',
        active: design?.active ?? true,
        position: design?.position || ''
      });

      if (design.imageUrl && design.imageUrl.url) {
        setImagePreview(design.imageUrl.url);
      }
    } else {
      // Reset form when creating new
      resetForm();
    }
  }, [design]);

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      title: '',
   
      tag: '',
      active: true,
      position: ''
    });
    setImagePreview(null);
    setImageFile(null);
    setErrors({});
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Handle switch toggle for active status
  const handleToggleActive = (checked) => {
    setFormData({
      ...formData,
      active: checked
    });
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

   
    if (!formData.position) {
      newErrors.position = 'Position is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
    
      payload.append('tag', formData.tag);
      payload.append('active', formData.active);
      payload.append('position', formData.position);

      if (imageFile) {
        payload.append('image', imageFile);
      }

      let response;

      if (design) {
        // Update existing Pet bakery
        response = await axios.put(`${API_URL}/update-pet-bakery/${design._id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Create new Pet bakery
        response = await axios.post(`${API_URL}/create-pet-bakery`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.status === 200 || response.status === 201) {
        onSuccess();
        toast.success( ' Pet bakery Updated/Created Successfully' )

        onClose();  // Close the dialog after successful submission
      } else {
        console.error('Error submitting form:', response);
        alert('');
        toast.error( 'Failed to save Pet bakery item' )

      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || 'An error occurred while saving the Pet bakery item' )
    
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {design ? 'Edit Pet Bakery Item' : 'Add New Pet Bakery Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter pet bakery title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>
          
        
          
          <div className="space-y-2">
            <Label htmlFor="tag">Tag</Label>
            <Input
              id="tag"
              name="tag"
              value={formData.tag}
              onChange={handleChange}
              placeholder="Enter tag"
              className={errors.tag ? "border-red-500" : ""}
            />
          
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              min={1}
              placeholder="Enter position"
              type="number"
              className={errors.position ? "border-red-500" : ""}
            />
            {errors.position && (
              <p className="text-red-500 text-xs mt-1">{errors.position}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            <div className="border border-dashed border-gray-300 rounded-md p-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-40 w-40 object-contain mx-auto rounded-md"
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
                      <p className="text-sm text-gray-500">Click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
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
            <Label htmlFor="active">Active Status</Label>
            <Switch
              id="active"
              checked={formData.active}
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
  );
};

export default CreateAndEdit;