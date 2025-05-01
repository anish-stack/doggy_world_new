import { API_URL } from '@/constant/Urls';
import axios from 'axios';
import { Loader2, Eye, EyeOff, X, Upload, Clock, MapPin, Star, Calendar, LinkIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const CreateAndEditClinc = () => {
  const getIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  };

  const id = getIdFromUrl();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    clinicName: "",
    attendentName: "",
    address: "",
    position: "",
    email: "",
    phone: "",
    password: "",
    openTime: "",
    closeTime: "",
    GMBPRofileLink: "",
    offDay: "",
    rating: 0,
    mapLocation: "",
    scanTestAvailableStatus: false,
    role: "clinic"
  });

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [removeImages, setRemoveImage] = useState([]);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [otpResendLoading, setOtpResendLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchClinicDetails();
    }
  }, [id]);

  useEffect(() => {
    let timer;
    if (otpResendTimer > 0) {
      timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpResendTimer]);

  const fetchClinicDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/clinic/get-clinic/${id}`);
      const clinicData = response.data.data;

      // Set form data
      setFormData({
        clinicName: clinicData.clinicName || "",
        attendentName: clinicData.attendentName || "",
        address: clinicData.address || "",
        position: clinicData.position || "",
        email: clinicData.email || "",
        phone: clinicData.phone || "",
        password: "", // Don't populate password for security
        openTime: clinicData.openTime || "",
        closeTime: clinicData.closeTime || "",
        GMBPRofileLink: clinicData.GMBPRofileLink || "",
        offDay: clinicData.offDay || "",
        rating: clinicData.rating || 0,
        mapLocation: clinicData.mapLocation || "",
        scanTestAvailableStatus: clinicData.scanTestAvailableStatus || false,
        role: clinicData.role || "clinic"
      });

      if (clinicData.imageUrl && clinicData.imageUrl.length > 0) {
        setImagePreviewUrls(clinicData.imageUrl.map(img => ({
          url: img.url,
          public_id: img.public_id,
        })));
      }
    } catch (error) {
      toast.error('Failed to load clinic details');
      console.error("Error fetching clinic details:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.clinicName.trim()) newErrors.clinicName = "Clinic name is required";
    if (!formData.attendentName.trim()) newErrors.attendentName = "Attendant name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.position) newErrors.position = "Position is required";
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    
    // Password validation for new clinics
    if (!isEditMode && !formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    // Time validation
    if (!formData.openTime) newErrors.openTime = "Opening time is required";
    if (!formData.closeTime) newErrors.closeTime = "Closing time is required";
    if (!formData.offDay) newErrors.offDay = "Off day is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      
      if (!isValidType) toast.error(`${file.name} is not a valid image type`);
      if (!isValidSize) toast.error(`${file.name} exceeds 5MB size limit`);
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length === 0) return;
    
    // Create preview URLs
    const newImagePreviewUrls = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      file
    }));
    
    setImagePreviewUrls(prev => [...prev, ...newImagePreviewUrls]);
    setImageFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveImage = (index, public_id) => {
    if (public_id) {
      // This is an existing image from the server
      setRemoveImage(prev => [...prev, public_id]);
      setImagePreviewUrls(prev => prev.filter(img => img.public_id !== public_id));
    } else {
      // This is a newly added image
      const newImageFiles = [...imageFiles];
      newImageFiles.splice(index, 1);
      setImageFiles(newImageFiles);
      
      const newImagePreviewUrls = [...imagePreviewUrls];
      URL.revokeObjectURL(newImagePreviewUrls[index].url);
      newImagePreviewUrls.splice(index, 1);
      setImagePreviewUrls(newImagePreviewUrls);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      document.getElementsByName(firstErrorField)[0]?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setSubmitLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach(key => {
        // Skip empty password in edit mode
        if (key === 'password' && isEditMode && !formData.password) {
          return;
        }
        formDataToSend.append(key, formData[key]);
      });

      // Append additional images
      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });
      
      if (removeImages.length > 0) {
        formDataToSend.append('removeImages', JSON.stringify(removeImages));
      }

      let response;
      if (isEditMode) {
        response = await axios.post(`${API_URL}/clinic/update/${id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Clinic updated successfully');
        window.location.href = '/dashboard/all-clinic';
      } else {
        response = await axios.post(`${API_URL}/clinic/regsiter`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Clinic created successfully');
        setOtpModal(true);
        setOtpResendTimer(60); // Start 60 second timer
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      console.error("Error submitting form:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    
    setOtpVerifyLoading(true);
    try {
      const response = await axios.post(`${API_URL}/clinic/verify-otp`, {
        email: formData.email,
        otp
      });
      
      toast.success('OTP verified successfully');
      setOtpModal(false);
      window.location.href = '/dashboard/all-clinic';
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendTimer > 0) return;
    
    setOtpResendLoading(true);
    try {
      const response = await axios.post(`${API_URL}/clinic/resend-otp?email=${formData.email}`, {
        email: formData.email
      });
      
      toast.success('OTP resent successfully');
      setOtpResendTimer(60); // Reset timer
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setOtpResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700 font-medium">Loading clinic details...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditMode ? 'Update Clinic' : 'Create New Clinic'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Name*
                </label>
                <input
                  type="text"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.clinicName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter clinic name"
                />
                {errors.clinicName && (
                  <p className="mt-1 text-sm text-red-600">{errors.clinicName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendant Name*
                </label>
                <input
                  type="text"
                  name="attendentName"
                  value={formData.attendentName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.attendentName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter attendant name"
                />
                {errors.attendentName && (
                  <p className="mt-1 text-sm text-red-600">{errors.attendentName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address*
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number*
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter 10-digit phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position*
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.position ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter position"
                />
                {errors.position && (
                  <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEditMode ? 'Password (Leave blank to keep current)' : 'Password*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Address Information</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address*
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter full address"
                ></textarea>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Map Location
                </label>
                <div className="flex">
                  <input
                    type="text"
                    name="mapLocation"
                    value={formData.mapLocation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter Google Maps coordinates"
                  />
                  <div className="ml-2 flex items-center text-gray-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Format: latitude,longitude (e.g., 12.9716,77.5946)
                </p>
              </div>
            </div>
          </div>
          
          {/* Business Hours */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Business Hours</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Time*
                </label>
                <div className="flex">
                  <input
                    type="time"
                    name="openTime"
                    value={formData.openTime}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.openTime ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <div className="ml-2 flex items-center text-gray-500">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                {errors.openTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.openTime}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Time*
                </label>
                <div className="flex">
                  <input
                    type="time"
                    name="closeTime"
                    value={formData.closeTime}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.closeTime ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <div className="ml-2 flex items-center text-gray-500">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                {errors.closeTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.closeTime}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Off Day*
                </label>
                <div className="flex">
                  <select
                    name="offDay"
                    value={formData.offDay}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.offDay ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select off day</option>
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="None">None</option>
                  </select>
                  <div className="ml-2 flex items-center text-gray-500">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
                {errors.offDay && (
                  <p className="mt-1 text-sm text-red-600">{errors.offDay}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google My Business Profile
                </label>
                <div className="flex">
                  <input
                    type="url"
                    name="GMBPRofileLink"
                    value={formData.GMBPRofileLink}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter GMB profile URL"
                  />
                  <div className="ml-2 flex items-center text-gray-500">
                    <LinkIcon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <div className="flex">
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="ml-2 flex items-center text-gray-500">
                    <Star className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter a value between 0 and 5
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scan Test Available
                </label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    name="scanTestAvailableStatus"
                    checked={formData.scanTestAvailableStatus}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Clinic offers scan tests
                  </span>
                </div>
              </div>
              
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="clinic">Clinic</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          
          {/* Clinic Images */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Clinic Images</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or JPEG (MAX. 5MB)
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/jpg"
                    multiple
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>
            
            {/* Image Previews */}
            {imagePreviewUrls.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Clinic Images ({imagePreviewUrls.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePreviewUrls.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={`Clinic image ${index + 1}`}
                        className="h-24 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index, image.public_id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditMode ? 'Update Clinic' : 'Create Clinic'}
            </button>
          </div>
        </form>
      </div>
      
      {/* OTP Verification Modal */}
      {otpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Verify Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification code to <span className="font-medium">{formData.email}</span>. 
              Please enter the 6-digit code below to verify your clinic.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpVerifyLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {otpVerifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpResendTimer > 0 || otpResendLoading}
                className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {otpResendLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : otpResendTimer > 0 ? (
                  `Resend OTP in ${otpResendTimer}s`
                ) : (
                  'Resend OTP'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard/all-clinic'}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAndEditClinc;