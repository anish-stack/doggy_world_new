import React, { useState, useEffect, useMemo } from 'react'
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "sonner"
import { API_URL, fetcher } from '@/constant/Urls'
import axios from 'axios'
import { X, Upload } from 'lucide-react'
import useSWR from 'swr'
import MultiSelect from '@/components/ui/MultiSelect'

const CreateAndEdit = ({ isOpen, onClose, design, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        whichFlavoredCake: [],
        isActive: true
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState({})

    const { data: flavours = [] } = useSWR(`${API_URL}/cake-flavours`, fetcher)
     const flavoursCome = useMemo(() => flavours?.data || [], [flavours]);
   

    useEffect(() => {
        if (design) {
            setFormData({
                name: design.name || '',
                position: design.position || '',
                whichFlavoredCake: design?.whichFlavoredCake?.map((item) => item?._id) || [],
                isActive: design.isActive !== undefined ? design.isActive : true,
            })
            if (design.image?.url) setImagePreview(design.image.url)
        } else {
            setFormData({
                name: '',
                position: '',
                whichFlavoredCake: [],
                isActive: true
            })
            setImageFile(null)
            setImagePreview(null)
        }
    }, [design])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    const handleToggleActive = (checked) => {
        setFormData({ ...formData, isActive: checked })
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(null)
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Flavor name is required'
        if (!formData.position) newErrors.position = 'Position is required'
        if (formData.whichFlavoredCake.length === 0) newErrors.whichFlavoredCake = 'At least one flavor must be selected'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsSubmitting(true)
        try {
            const payload = new FormData()
            payload.append('name', formData.name)
            payload.append('position', formData.position)
            payload.append('isActive', formData.isActive)
            formData.whichFlavoredCake.forEach(id => payload.append('whichFlavoredCake[]', id))
            if (imageFile) payload.append('image', imageFile)

            let response
            if (design) {
                response = await axios.put(`${API_URL}/cake-design/${design._id}`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            } else {
                response = await axios.post(`${API_URL}/cake-design`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }

            if (response.status === 200 || response.status === 201) {
                toast.success(`Cake design ${design ? 'updated' : 'created'} successfully`)
                onSuccess()
                onClose()
            }
        } catch (err) {
            console.error(err)
            toast.error('An error occurred while saving the design')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{design ? 'Edit Cake Design' : 'Add New Cake Design'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Design Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter name"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                            id="position"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            placeholder="Enter position"
                            className={errors.position ? 'border-red-500' : ''}
                        />
                        {errors.position && <p className="text-xs text-red-500">{errors.position}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="flavors">Flavored Cake</Label>
                        <MultiSelect
                            id="flavors"
                            options={flavoursCome.map(f => ({ label: f.name, value: f._id }))}
                            selected={formData.whichFlavoredCake}
                            onChange={(selected) => setFormData({ ...formData, whichFlavoredCake: selected })}
                        />
                        {errors.whichFlavoredCake && <p className="text-xs text-red-500">{errors.whichFlavoredCake}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Flavor Image</Label>
                        <div className="border border-dashed p-4 rounded-md">
                            {imagePreview ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="h-40 w-40 object-cover rounded-md mx-auto" />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center py-6 text-gray-500">
                                    <Upload className="h-10 w-10 mb-2" />
                                    <span>Click to upload image</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="isActive">Active Status</Label>
                        <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleToggleActive} />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? 'Saving...' : design ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateAndEdit