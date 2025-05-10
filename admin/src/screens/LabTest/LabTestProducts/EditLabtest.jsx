import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, ArrowLeft, ImagePlus, X, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '@/constant/Urls';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import axios from 'axios';

const fetcher = (...args) => fetch(...args).then(res => res.json());

const EditLabtest = () => {
    const router = useNavigate();
    const { id } = useParams()

    const { data: vaccineTypesData, error: vaccineTypesError } = useSWR(`${API_URL}/list-all-LabTest-types`, fetcher);

    console.log("LabTest Types", vaccineTypesData)

    // Fetch vaccine data
    const { data, error, mutate } = useSWR(
        id ? `http://localhost:8000/api/v1/LabTest-product/${id}` : null,
        fetcher
    );
    console.log("LabTest data", data)
    const [formData, setFormData] = useState({
        title: '',
        price: 0,
        discount_price: 0,
        off_percentage: 0,
        is_active: true,
        tag: '',
        forage: '',
        is_dog: true,
        is_cat: false,
        is_popular: false,
        is_imaging_test: false,
        is_common_for_cat: false,
        is_common_for_dog: false,
        small_desc: '',
        desc: '',
        is_package: false,
        home_price_of_package: 0,
        home_price_of_package_discount: 0,
        position: 1,

    });

    const [images, setImages] = useState([]);
    const [mainImage, setMainImage] = useState(null);
    const [existingImages, setExistingImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    // Set form data when API response is received
    useEffect(() => {
        if (data && data.data) {
            const vaccineData = data.data;

            // Normalize forage value
            const allowedForageValues = ['Puppy', 'Adult', 'Senior', 'All Ages'];
            let normalizedForage = (vaccineData.forage || '').trim();

            if (!allowedForageValues?.includes(normalizedForage)) {
                normalizedForage = ''; // default to empty if invalid
            }

            setFormData({
                title: vaccineData.title || '',
                price: vaccineData.price || 0,
                discount_price: vaccineData.discount_price || 0,
                off_percentage: vaccineData.off_percentage || 0,
                is_active: vaccineData.is_active ?? true,
                tag: vaccineData.tag || '',
                forage: normalizedForage, // use normalized

                is_imaging_test: vaccineData.is_imaging_test ?? true,
                is_dog: vaccineData.is_dog ?? true,
                is_cat: vaccineData.is_cat ?? false,
                is_popular: vaccineData.is_popular ?? false,
                is_common_for_cat: vaccineData.is_common_for_cat ?? false,
                is_common_for_dog: vaccineData.is_common_for_dog ?? false,
                small_desc: vaccineData.small_desc || '',
                desc: vaccineData.desc || '',
                is_package: vaccineData.is_package ?? false,
                home_price_of_package: vaccineData.home_price_of_package || 0,
                home_price_of_package_discount: vaccineData.home_price_of_package_discount || 0,
                position: vaccineData.position || 1,
                WhichTypeOfvaccinations: vaccineData.WhichTypeOfvaccinations.map((item) => item?._id) || []
            });

            if (vaccineData.mainImage) {
                setMainImage(vaccineData.mainImage);
            }

            if (vaccineData.image && vaccineData.image.length > 0) {
                setExistingImages(vaccineData.image);
            }
        }
    }, [data]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
        }));
    };

    const handleSwitchChange = (name, checked) => {
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };
    const handleVaccineTypeChange = (vaccineId, isChecked) => {
        setFormData(prev => {
            if (isChecked) {
                // Add the vaccine ID if checked
                return {
                    ...prev,
                    WhichTypeOfvaccinations: [...prev.WhichTypeOfvaccinations, vaccineId]
                };
            } else {
                // Remove the vaccine ID if unchecked
                return {
                    ...prev,
                    WhichTypeOfvaccinations: prev.WhichTypeOfvaccinations.filter(id => id !== vaccineId)
                };
            }
        });
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImages(prev => [...prev, ...files]);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imageId) => {
        setExistingImages(prev => prev.filter(img => img._id !== imageId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();

            // Append all form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    formDataToSend.append(key, JSON.stringify(value));
                } else {
                    formDataToSend.append(key, value);
                }
            });

            // Append images
            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            const { data } = await axios.put(`${API_URL}/LabTest-update-product/${id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(data.message || 'Lab Test product updated successfully!');

            setAlert({
                show: true,
                type: 'success',
                message: data.message || 'Lab Test product updated successfully!'
            });

            // Redirect back after short delay
            setTimeout(() => {
                router('/dashboard/all-labtest');
            }, 2000);

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error updating vaccine product');

            setAlert({
                show: true,
                type: 'error',
                message: error.response?.data?.message || 'Error updating vaccine product'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (error) return (
        <div className="container mx-auto p-4">
            <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load vaccine product data. Please try again.</AlertDescription>
            </Alert>
            <Button onClick={() => router('/dashboard/all-labtest')}>Back to List</Button>
        </div>
    );

    if (!data && !error) return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading product data...</span>
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center mb-6">
                <Button variant="ghost" onClick={() => router('/dashboard/all-labtest')} className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to List
                </Button>
                <h1 className="text-2xl font-bold">Edit Lab Test Product</h1>
            </div>

            {alert.show && (
                <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-6">
                    <AlertTitle>{alert.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                    <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tag">Tag</Label>
                                <Input
                                    id="tag"
                                    name="tag"
                                    value={formData.tag}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="discount_price">Discount Price (₹)</Label>
                                <Input
                                    id="discount_price"
                                    name="discount_price"
                                    type="number"
                                    value={formData.discount_price}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="forage">Age Group </Label>
                                <Select
                                    name="forage"
                                    value={formData?.forage}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, forage: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select age group">
                                            {formData?.forage || 'Select age group'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Puppy">Puppy</SelectItem>
                                        <SelectItem value="Adult">Adult</SelectItem>
                                        <SelectItem value="Senior">Senior</SelectItem>
                                        <SelectItem value="All Ages">All Ages</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>


                            <div className="space-y-2">
                                <Label htmlFor="position">Position</Label>
                                <Input
                                    id="position"
                                    name="position"
                                    type="number"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_dog"
                                    checked={formData.is_dog}
                                    onCheckedChange={(checked) => handleSwitchChange('is_dog', checked)}
                                />
                                <Label htmlFor="is_dog">For Dogs</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_imaging_test"
                                    checked={formData.is_imaging_test}
                                    onCheckedChange={(checked) => handleSwitchChange('is_imaging_test', checked)}
                                />
                                <Label htmlFor="is_imaging_test">Imaging test</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_cat"
                                    checked={formData.is_cat}
                                    onCheckedChange={(checked) => handleSwitchChange('is_cat', checked)}
                                />
                                <Label htmlFor="is_cat">For Cats</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_popular"
                                    checked={formData.is_popular}
                                    onCheckedChange={(checked) => handleSwitchChange('is_popular', checked)}
                                />
                                <Label htmlFor="is_popular">Popular</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_common_for_cat"
                                    checked={formData.is_common_for_cat}
                                    onCheckedChange={(checked) => handleSwitchChange('is_common_for_cat', checked)}
                                />
                                <Label htmlFor="is_common_for_cat">Common Disease For Cats</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_common_for_dog"
                                    checked={formData.is_common_for_dog}
                                    onCheckedChange={(checked) => handleSwitchChange('is_common_for_dog', checked)}
                                />
                                <Label htmlFor="is_common_for_dog">Common Disease For Dog</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_package"
                                    checked={formData.is_package}
                                    onCheckedChange={(checked) => handleSwitchChange('is_package', checked)}
                                />
                                <Label htmlFor="is_package">Is Package</Label>
                            </div>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="home_price_of_package">Home Price (₹)</Label>
                                <Input
                                    id="home_price_of_package"
                                    name="home_price_of_package"
                                    type="number"
                                    value={formData.home_price_of_package}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="home_price_of_package_discount">Home Price Discount (₹)</Label>
                                <Input
                                    id="home_price_of_package_discount"
                                    name="home_price_of_package_discount"
                                    type="number"
                                    value={formData.home_price_of_package_discount}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Vaccination Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>Select Vaccination Types</Label>
                            <div className="grid grid-cols-1 gap-2 mt-2">
                                {vaccineTypesData?.data?.map((type) => (
                                    <div key={type._id} className="flex items-center space-x-2 border p-3 rounded-md">
                                        <Checkbox
                                            id={`vaccine-type-${type._id}`}
                                            checked={formData?.WhichTypeOfvaccinations?.includes(type._id)}
                                            onCheckedChange={(checked) =>
                                                handleVaccineTypeChange(type._id, checked)
                                            }
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                {type.image?.url && (
                                                    <img
                                                        src={type.image.url}
                                                        alt={type.title}
                                                        className="w-12 h-12 rounded-md mr-3 object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <Label
                                                        htmlFor={`vaccine-type-${type._id}`}
                                                        className="font-medium"
                                                    >
                                                        {type.title}
                                                    </Label>
                                                    <p className="text-sm text-gray-500">{type.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {formData?.WhichTypeOfvaccinations?.includes(type._id) && (
                                            <Check className="h-4 w-4 text-green-500" />
                                        )}
                                    </div>
                                ))}

                                {vaccineTypesData?.data?.length === 0 && (
                                    <p className="text-gray-500">No vaccination types available</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>


                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="small_desc">Short Description</Label>
                            <Textarea
                                id="small_desc"
                                name="small_desc"
                                value={formData.small_desc}
                                onChange={handleInputChange}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc">Full Description</Label>
                            <Textarea
                                id="desc"
                                name="desc"
                                value={formData.desc}
                                onChange={handleInputChange}
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>


                <Card>
                    <CardHeader>
                        <CardTitle>Images</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <Label>Existing Images</Label>
                            {existingImages.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {existingImages.map((image) => (
                                        <div key={image._id} className="relative">
                                            <img
                                                src={image.url}
                                                alt="Product"
                                                className="w-full h-40 object-cover rounded-md"
                                            />
                                            <div className="absolute bottom-2 left-2 flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setMainImage(image)}
                                                    className={mainImage && mainImage.public_id === image.public_id ? 'bg-green-500 text-white' : ''}
                                                >
                                                    Main
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => removeExistingImage(image._id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No existing images</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="images">Upload New Images</Label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <ImagePlus className="w-8 h-8 mb-2 text-gray-500" />
                                        <p className="mb-2 text-sm text-gray-500">Click to upload</p>
                                        <p className="text-xs text-gray-500">SVG, PNG, JPG or WEBP</p>
                                    </div>
                                    <input
                                        id="images"
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>

                            {images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                    {images.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt={`New upload ${index + 1}`}
                                                className="w-full h-40 object-cover rounded-md"
                                            />
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="absolute top-2 right-2"
                                                onClick={() => removeImage(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/vaccines')}
                        className="mr-2"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditLabtest;