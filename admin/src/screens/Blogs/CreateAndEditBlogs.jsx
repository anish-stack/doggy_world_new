import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from "sonner";
import axios from 'axios';

// UI Components
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
    ArrowLeft, 
    Upload, 
    X, 
    AlertCircle, 
    Loader2, 
    Plus, 
    Image as ImageIcon,
    Tag,
    Save,
    EyeOff,
    Eye
} from "lucide-react";

// API URL
import { API_URL } from "@/constant/Urls";


const CreateAndEditBlogs = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "",
        tags: [],
        isPublished: false,
    });

    // Tags state
    const [tagInput, setTagInput] = useState("");

    // Multiple images handling
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [imagesToRemove, setImagesToRemove] = useState([]);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const [formChanged, setFormChanged] = useState(false);
    const [imageError, setImageError] = useState("");
    const [errors, setErrors] = useState({
        title: "",
        content: "",
        category: "",
        tags: "",
        images: ""
    });

    // Check if we're in edit mode and fetch data if needed
    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            // If we have Blog data from navigation state, use it
            if (location.state?.blog) {
                initializeEditData(location.state.blog);
            } else {
                // Otherwise fetch the blog data
                fetchBlogDetails();
            }
        }
    }, [id, location.state]);

    // Set edit data
    const initializeEditData = (blog) => {
        setFormData({
            title: blog?.title || '',
            content: blog?.content || '',
            category: blog?.category || '',
            tags: blog?.tags || [],
            isPublished: blog?.isPublished || false,
        });

        if (blog.imageUrl && Array.isArray(blog.imageUrl)) {
            const images = blog.imageUrl.map(img => ({
                url: img.url,
                public_id: img.public_id,
                _id: img._id
            }));

            setExistingImages(images);
            setImagePreviews(images.map(img => img.url));
        }
    };

    // Fetch Blog details for edit mode
    const fetchBlogDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/blogs/${id}`);
            if (response.data.success) {
                initializeEditData(response.data.data);
            } else {
                toast.error("Failed to fetch blog details");
                navigate("/dashboard/all-blogs");
            }
        } catch (error) {
            console.error("Error fetching blog:", error);
            toast.error("Error fetching blog details");
            navigate("/dashboard/all-blogs");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setFormChanged(true);
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    // Handle category selection
   

    // Handle publish status switch
    const handleSwitchChange = (checked) => {
        setFormData((prev) => ({ ...prev, isPublished: checked }));
        setFormChanged(true);
    };

    // Handle tag input
    const handleTagInputChange = (e) => {
        setTagInput(e.target.value);
    };

    // Add a tag when Enter is pressed
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            addTag();
        }
    };

    // Add a tag from input
    const addTag = () => {
        const newTag = tagInput.trim();
        if (newTag && !formData.tags.includes(newTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag]
            }));
            setTagInput("");
            setFormChanged(true);
            
            // Clear error
            if (errors.tags) {
                setErrors(prev => ({ ...prev, tags: "" }));
            }
        }
    };

    // Remove a tag
    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
        setFormChanged(true);
    };

    // Handle image selection
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
    
        let hasError = false;
        const newImageFiles = [...imageFiles];
        const newImagePreviews = [...imagePreviews];
    
        files.forEach(file => {
            // Check file type
            const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!validTypes.includes(file.type)) {
                setImageError("Please select valid image files (JPEG, PNG, WebP)");
                setErrors(prev => ({ ...prev, images: "Please select valid image files (JPEG, PNG, WebP)" }));
                hasError = true;
                return;
            }
    
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setImageError("Image size should be less than 2MB");
                setErrors(prev => ({ ...prev, images: "Image size should be less than 2MB" }));
                hasError = true;
                return;
            }
    
            // Create preview and add file
            const reader = new FileReader();
            reader.onload = () => {
                newImagePreviews.push(reader.result);
                setImagePreviews([...newImagePreviews]);
            };
            reader.readAsDataURL(file);
    
            newImageFiles.push(file);
        });
    
        if (!hasError) {
            setImageFiles([...newImageFiles]);
            setImageError("");
            setErrors(prev => ({ ...prev, images: "" }));
            setFormChanged(true);
        }
    };
    
    // Remove an image
    const handleRemoveImage = (index) => {
        // Check if this is an existing image or a new upload
        if (index < existingImages.length) {
            // It's an existing image
            const imageToRemove = existingImages[index];
            setImagesToRemove([...imagesToRemove, imageToRemove._id]);
    
            // Remove from previews array
            const newPreviews = [...imagePreviews];
            newPreviews.splice(index, 1);
            setImagePreviews(newPreviews);
    
            // Remove from existing images array
            const newExisting = [...existingImages];
            newExisting.splice(index, 1);
            setExistingImages(newExisting);
        } else {
            // It's a new upload
            const newFileIndex = index - existingImages.length;
    
            // Remove from files array
            const newFiles = [...imageFiles];
            newFiles.splice(newFileIndex, 1);
            setImageFiles(newFiles);
    
            // Remove from previews array
            const newPreviews = [...imagePreviews];
            newPreviews.splice(index, 1);
            setImagePreviews(newPreviews);
        }
    
        setFormChanged(true);
    };

    // Validate form before submission
    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
            isValid = false;
        }

        if (!formData.content.trim()) {
            newErrors.content = "Content is required";
            isValid = false;
        }

        if (!formData.category.trim()) {
            newErrors.category = "Category is required";
            isValid = false;
        }

        // Only require images for new blogs, not for edits
        if (!isEditMode && imagePreviews.length === 0) {
            newErrors.images = "At least one image is required";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }
    
        setIsLoading(true);

        // Prepare data for multipart/form-data submission
        const submitData = new FormData();
        submitData.append("title", formData.title);
        submitData.append("content", formData.content);
        submitData.append("category", formData.category);
        
        // Add tags as JSON string
        submitData.append("tags", JSON.stringify(formData.tags));
        
        submitData.append("isPublished", formData.isPublished);
    
        // Add new images
        imageFiles.forEach(file => {
            submitData.append("images", file);
        });
    
        // Add image IDs to remove
        if (imagesToRemove.length > 0) {
            submitData.append("removeImages", JSON.stringify(imagesToRemove));
        }
    
        try {
            let response;
    
            if (isEditMode) {
                // For edit, use PUT request
                response = await axios.post(`${API_URL}/blogs/${id}`, submitData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            } else {
                // For create, use POST request
                response = await axios.post(`${API_URL}/blogs`, submitData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            }
    
            if (response.data.success) {
                toast.success(
                    isEditMode
                        ? "Blog updated successfully"
                        : "Blog created successfully"
                );
                navigate("/dashboard/all-blogs");
            } else {
                toast.error(response.data.message || "Operation failed");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error(
                error.response?.data?.message ||
                "An error occurred. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle back button
    const handleBack = () => {
        if (formChanged) {
            setShowDiscardDialog(true);
        } else {
            navigate("/dashboard/all-blogs");
        }
    };

    // Cancel form and navigate back
    const handleDiscard = () => {
        setShowDiscardDialog(false);
        navigate("/dashboard/all-blogs");
    };

    return (
        <div className="container mx-auto p-4 md:p-6">
            <div className="flex items-center mb-6">
                <Button variant="ghost" onClick={handleBack} className="mr-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold">
                    {isEditMode ? "Edit Blog" : "Create New Blog"}
                </h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content - Left side */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Blog Content</CardTitle>
                                <CardDescription>
                                    Enter the details for your blog post
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-base font-medium">
                                        Title <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Enter blog title"
                                        className={errors.title ? "border-red-500" : ""}
                                    />
                                    {errors.title && (
                                        <p className="text-red-500 text-sm flex items-center mt-1">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.title}
                                        </p>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <Label htmlFor="content" className="text-base font-medium">
                                        Content <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="content"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        placeholder="Write your blog content here..."
                                        className={`min-h-[200px] ${errors.content ? "border-red-500" : ""}`}
                                    />
                                    {errors.content && (
                                        <p className="text-red-500 text-sm flex items-center mt-1">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.content}
                                        </p>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-base font-medium">
                                        Category <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        placeholder="Enter category title"
                                        className={errors.category ? "border-red-500" : ""}
                                    />
                                    {errors.category && (
                                        <p className="text-red-500 text-sm flex items-center mt-1">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.category}
                                        </p>
                                    )}
                                </div>

                                {/* Tags */}
                                <div className="space-y-2">
                                    <Label htmlFor="tags" className="text-base font-medium">
                                        Tags
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="tags"
                                            value={tagInput}
                                            onChange={handleTagInputChange}
                                            onKeyDown={handleTagKeyDown}
                                            placeholder="Add tags (press Enter to add)"
                                            className="flex-1"
                                        />
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={addTag}
                                            disabled={!tagInput.trim()}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add
                                        </Button>
                                    </div>
                                    
                                    {formData.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.tags.map((tag, index) => (
                                                <Badge 
                                                    key={index} 
                                                    variant="secondary"
                                                    className="px-2 py-1 flex items-center gap-1"
                                                >
                                                    <Tag className="h-3 w-3" />
                                                    {tag}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                                        onClick={() => removeTag(tag)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Right side */}
                    <div className="space-y-6">
                        {/* Publish Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Publish Settings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="isPublished" className="text-base font-medium">
                                            Publish Status
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {formData.isPublished ? "Published" : "Draft"}
                                        </p>
                                    </div>
                                    <Switch
                                        id="isPublished"
                                        checked={formData.isPublished}
                                        onCheckedChange={handleSwitchChange}
                                    />
                                </div>
                                <div className="mt-4 text-sm text-muted-foreground">
                                    {formData.isPublished ? (
                                        <div className="flex items-center text-green-600">
                                            <Eye className="h-4 w-4 mr-1" />
                                            <span>Your blog will be visible to everyone</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-amber-600">
                                            <EyeOff className="h-4 w-4 mr-1" />
                                            <span>Your blog will be saved as a draft</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    type="submit" 
                                    className="w-full" 
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {isEditMode ? "Updating..." : "Creating..."}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            {isEditMode ? "Update Blog" : "Create Blog"}
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Image Upload */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Blog Images</CardTitle>
                                <CardDescription>
                                    Upload images for your blog post
                                    {!isEditMode && <span className="text-red-500 ml-1">*</span>}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="dropzone-file"
                                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                            errors.images ? "border-red-500" : "border-gray-300"
                                        }`}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                            <p className="mb-2 text-sm text-center text-gray-500">
                                                <span className="font-semibold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG or WEBP (MAX. 2MB)
                                            </p>
                                        </div>
                                        <input
                                            id="dropzone-file"
                                            type="file"
                                            className="hidden"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            multiple
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                </div>

                                {errors.images && (
                                    <p className="text-red-500 text-sm flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        {errors.images}
                                    </p>
                                )}

                                {/* Image previews */}
                                {imagePreviews.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-sm font-medium mb-2">
                                            Images ({imagePreviews.length})
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {imagePreviews.map((src, index) => (
                                                <div 
                                                    key={index} 
                                                    className="relative group aspect-square border rounded-md overflow-hidden"
                                                >
                                                    <img
                                                        src={src}
                                                        alt={`Preview ${index}`}
                                                        className="object-cover w-full h-full transition-opacity group-hover:opacity-75"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleRemoveImage(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>

            {/* Discard Changes Dialog */}
            <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to discard them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDiscard} className="bg-red-600 hover:bg-red-700">
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CreateAndEditBlogs;