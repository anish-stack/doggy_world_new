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
import { ArrowLeft, Upload, X, AlertCircle, Loader2, Plus } from "lucide-react";
import { API_URL } from "@/constant/Urls";

const SERVICE_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "vaccination", label: "Vaccination" },
  { value: "grooming", label: "Grooming" },
  { value: "medical", label: "Medical Services" },
  { value: "wellness", label: "Wellness Programs" },
  { value: "therapy", label: "Therapy Sessions" },
  { value: "diagnostic", label: "Diagnostic Services" },
  { value: "emergency", label: "Emergency Care" },
  { value: "rehabilitation", label: "Rehabilitation" },
  { value: "specialist", label: "Specialist Referral" },
  { value: "preventive", label: "Preventive Care" },
  { value: "go-to", label: "Quick Access" },
];

export default function CreateAndEditServiceBanner() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Form state
  const [formData, setFormData] = useState({
    type: "go-to",
    position: "",
    isActive: true,
  });

  // Multiple images handling
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [typeAlready, setTypeAlready] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [positionError, setPositionError] = useState("");
  const [typeError, setTypeError] = useState("");
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

      position: banner.position || "",
      isActive: banner.isActive !== undefined ? banner.isActive : true,
    });
    setTypeAlready(banner?.type)

    if (banner.imageUrl && Array.isArray(banner.imageUrl)) {
      const images = banner.imageUrl.map(img => ({
        url: img.url,
        public_id: img.public_id,
        _id: img._id
      }));

      setExistingImages(images);
      setImagePreviews(images.map(img => img.url));
    }
  };

  // Fetch banner details for edit mode
  const fetchBannerDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/service-banner/${id}`);
      if (response.data.success) {
        initializeEditData(response.data.data);
        setTypeAlready(response.data.data?.type)
      } else {
        toast.error("Failed to fetch banner details");
        navigate("/dashboard/service-banners");
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
      toast.error("Error fetching banner details");
      navigate("/dashboard/service-banners");
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
  };

  // Handle type select change
  const handleTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, type: value }));
    setTypeError("");
    setFormChanged(true);
  };

  // Handle switch change
  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
    setFormChanged(true);
  };
  useEffect(() => {
    if (typeAlready && formData.type !== typeAlready) {
      setFormData((prev) => ({
        ...prev,
        type: typeAlready
      }));
    }
  }, [typeAlready, formData.type]);



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
        hasError = true;
        return;
      }

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setImageError("Image size should be less than 2MB");
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

  // Validate form
  const validateForm = () => {
    let isValid = true;

    if (!formData.type.trim()) {
      setTypeError("Service type is required");
      isValid = false;
    }

    if (!formData.position.toString().trim()) {
      setPositionError("Position is required");
      isValid = false;
    }

    // Require at least one image (either existing or new) for create mode
    // For edit mode, allow removing all images only if new ones are being added
    if (!isEditMode && imagePreviews.length === 0) {
      setImageError("Please select at least one image");
      isValid = false;
    }

    return isValid;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Create FormData for multipart/form-data submission
    const submitData = new FormData();
    submitData.append("type", formData.type);
    submitData.append("position", formData.position);
    submitData.append("isActive", formData.isActive);

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
        response = await axios.post(`${API_URL}/service-banner/${id}`, submitData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // For create, use POST request
        response = await axios.post(`${API_URL}/service-banner`, submitData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (response.data.success) {
        toast.success(
          isEditMode
            ? "Service banner updated successfully"
            : "Service banner created successfully"
        );
        navigate("/dashboard/service-banners");
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
      navigate("/dashboard/service-banners");
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
        Back to All Service Banners
      </Button>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isEditMode ? "Edit Service Banner" : "Create New Service Banner"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the details of the existing service banner"
              : "Add a new banner to display on the services page"}
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
                The position determines the order of banners on the services page
              </p>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Service Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type || ""}
                onValueChange={handleTypeChange}

                disabled={isLoading}
              >
                <SelectTrigger className={typeError ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeError && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} /> {typeError}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Category of service this banner represents
              </p>
            </div>


            {/* Is Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  Activate or deactivate this service banner
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={handleSwitchChange}
                disabled={isLoading}
              />
            </div>

            {/* Banner Images */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">
                  Banner Images {!isEditMode && <span className="text-red-500">*</span>}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => document.getElementById("image-upload").click()}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Images
                </Button>
              </div>

              {imagePreviews.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Banner preview ${index + 1}`}
                        className="h-40 w-full object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors
                    ${imageError ? "border-red-500" : "border-gray-300"}`}
                  onClick={() => document.getElementById("image-upload").click()}
                >
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium">Click to upload images</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG or WebP (max 2MB each)
                    </p>
                  </div>
                </div>
              )}

              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                multiple
                disabled={isLoading}
              />

              {imageError && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} /> {imageError}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                You can upload multiple images for this service banner
              </p>
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
              onClick={() => navigate("/dashboard/service-banners")}
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