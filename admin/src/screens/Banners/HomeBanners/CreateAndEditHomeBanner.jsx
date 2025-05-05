import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { ArrowLeft, Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { API_URL } from "@/constant/Urls";

export default function CreateAndEditHomeBanner() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  // Form state
  const [formData, setFormData] = useState({
    link: "",
    position: "",
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [positionError, setPositionError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [imageError, setImageError] = useState("");

  // Check if we're in edit mode
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      // If we have banner data from navigation state, use it
      if (location.state?.banner) {
        initializeEditData(location.state.banner);
      } else {
        // Otherwise fetch the banner data
        fetchBannerDetails();
      }
    }
  }, [id, location.state]);

  // Set edit data
  const initializeEditData = (banner) => {
    setFormData({
      link: banner.link || "",
      position: banner.position || "",
      isActive: banner.isActive !== undefined ? banner.isActive : true,
    });
    
    if (banner.imageUrl && banner.imageUrl.url) {
      setImagePreview(banner.imageUrl.url);
    }
  };

  // Fetch banner details for edit mode
  const fetchBannerDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/home-banner/${id}`);
      if (response.data.success) {
        initializeEditData(response.data.data);
      } else {
        toast.error("Failed to fetch banner details");
        navigate("/banners/home");
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
      toast.error("Error fetching banner details");
      navigate("/banners/home");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormChanged(true);
    
    // Clear errors
    if (name === "position") setPositionError("");
    if (name === "link") setLinkError("");
  };

  // Handle switch change
  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
    setFormChanged(true);
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, WebP)");
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image size should be less than 2MB");
      return;
    }

    setImageFile(file);
    setImageError("");
    setFormChanged(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    if (!isEditMode) {
      setImagePreview("");
    } else {
      // In edit mode, just mark that we want to remove the current image
      setImagePreview("remove");
    }
    setFormChanged(true);
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;

    if (!formData.link.trim()) {
      setLinkError("Link is required");
      isValid = false;
    }

    if (!formData.position.toString().trim()) {
      setPositionError("Position is required");
      isValid = false;
    }

    if (!isEditMode && !imageFile && !imagePreview) {
      setImageError("Please select an image");
      isValid = false;
    }

    return isValid;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Create FormData for multipart/form-data submission (for file upload)
    const submitData = new FormData();
    submitData.append("link", formData.link);
    submitData.append("position", formData.position);
    submitData.append("isActive", formData.isActive);

    if (imageFile) {
      submitData.append("image", imageFile);
    }

    try {
      let response;
      
      if (isEditMode) {
        // For edit, we use PUT request
        response = await axios.post(`${API_URL}/home-banner/${id}`, submitData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // For create, we use POST request
        response = await axios.post(`${API_URL}/home-banner`, submitData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (response.data.success) {
        toast.success(
          isEditMode
            ? "Banner updated successfully"
            : "Banner created successfully"
        );
        navigate("/dashboard/home-screen-banners");
      } else {
        toast.error(response.data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error.response?.data?.message?.includes("Position")) {
        setPositionError(error.response.data.message);
      } else {
        toast.error(
          error.response?.data?.message || 
          "An error occurred. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (formChanged) {
      setShowDiscardDialog(true);
    } else {
      navigate("/dashboard/home-screen-banners");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Button 
        variant="ghost" 
        onClick={handleBack} 
        className="mb-6 hover:bg-transparent p-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to All Banners
      </Button>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isEditMode ? "Edit Home Banner" : "Create New Home Banner"}
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? "Update the details of the existing banner" 
              : "Add a new banner to display on the home page"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position" className="text-sm font-medium">
                Position <span className="text-red-500">*</span>
              </Label>
              <Input
                id="position"
                name="position"
                type="number"
                placeholder="Enter display position (e.g. 1, 2, 3)"
                value={formData.position}
                onChange={handleInputChange}
                disabled={isLoading}
                className={positionError ? "border-red-500" : ""}
              />
              {positionError && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} /> {positionError}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                The position determines the order of banners on the home page
              </p>
            </div>
            
            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="link" className="text-sm font-medium">
                Link <span className="text-red-500">*</span>
              </Label>
              <Input
                id="link"
                name="link"
                placeholder="Enter banner link"
                value={formData.link}
                onChange={handleInputChange}
                disabled={isLoading}
                className={linkError ? "border-red-500" : ""}
              />
              {linkError && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} /> {linkError}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                URL where the banner should redirect when clicked
              </p>
            </div>
            
            {/* Is Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  Activate or deactivate this banner
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={handleSwitchChange}
                disabled={isLoading}
              />
            </div>
            
            {/* Banner Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Banner Image {!isEditMode && <span className="text-red-500">*</span>}
              </Label>
              
              {imagePreview && imagePreview !== "remove" ? (
                <div className="relative mt-2">
                  <img
                    src={imagePreview}
                    alt="Banner preview"
                    className="h-48 w-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors
                    ${imageError ? "border-red-500" : "border-gray-300"}`}
                  onClick={() => document.getElementById("image-upload").click()}
                >
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG or WebP (max 2MB)
                    </p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>
              )}
              
              {imageError && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} /> {imageError}
                </p>
              )}
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditMode ? "Update Banner" : "Create Banner"
            )}
          </Button>
        </CardFooter>
      </Card>
      
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
            <AlertDialogAction
              onClick={() => navigate("/banners/home")}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}