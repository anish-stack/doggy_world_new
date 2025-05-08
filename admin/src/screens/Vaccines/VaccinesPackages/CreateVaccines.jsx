import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/constant/Urls';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const fetcher = (...args) => fetch(...args).then(res => res.json());

const CreateVaccines = () => {
    const router = useNavigate();

    const { data: vaccineTypesData, error: vaccineTypesError } = useSWR(`${API_URL}/list-all-vaccine-types`, fetcher);

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
        small_desc: '',
        desc: '',
        is_package: false,
        home_price_of_package: 0,
        home_price_of_package_discount: 0,
        position: 1,
        WhichTypeOfvaccinations: [],
        VaccinedInclueds: ''
    });

    const [error, setError] = useState('');
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();

            // Append all form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    // Handle arrays properly
                    value.forEach(item => {
                        formDataToSend.append(`${key}[]`, item);
                    });
                } else if (typeof value === 'object' && value !== null) {
                    formDataToSend.append(key, JSON.stringify(value));
                } else {
                    formDataToSend.append(key, value);
                }
            });

            // Append images
            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            const response = await fetch(`http://localhost:8000/api/v1/vaccine-product`, {
                method: 'POST',
                body: formDataToSend,
            });

            const result = await response.json();

            if (response.ok) {
                setAlert({
                    show: true,
                    type: 'success',
                    message: 'Vaccine product added successfully!'
                });

                toast.success('Vaccine product added successfully!')
                // Redirect back to list after short delay
                setTimeout(() => {
                    router('/dashboard/all-vaccination');
                }, 2000);
            } else {
                toast.error(result.message || 'Failed to add vaccine product')

                throw new Error(result.message || 'Failed to add vaccine product');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to add vaccine product')

            setAlert({
                show: true,
                type: 'error',
                message: error.message || 'Error adding vaccine product'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (error || vaccineTypesError) return (
        <div className="container mx-auto p-4">
            <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load data. Please try again.</AlertDescription>
            </Alert>
            <Button onClick={() => router('/dashboard/all-vaccination')}>Back to List</Button>
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center mb-6">
                <Button variant="ghost" onClick={() => router('/dashboard/all-vaccination')} className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to List
                </Button>
                <h1 className="text-2xl font-bold">Add Vaccine Product</h1>
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
                                    type="text"
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
                                    type="text"
                                    value={formData.discount_price}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="forage">Age Group </Label>
                                <Select
                                    name="forage"
                                    value={formData.forage}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, forage: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select age group">
                                            {formData.forage || 'Select age group'}
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
                                            checked={formData.WhichTypeOfvaccinations.includes(type._id)}
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
                                        {formData.WhichTypeOfvaccinations.includes(type._id) && (
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

                        <div className="space-y-2">
                            <Label htmlFor="VaccinedInclueds">Vaccinations Included (comma-separated)</Label>
                            <Textarea
                                id="VaccinedInclueds"
                                name="VaccinedInclueds"
                                value={formData.VaccinedInclueds}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="E.g. Rabies, Parvo, Distemper"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter vaccination names separated by commas
                            </p>
                        </div>
                    </CardContent>
                </Card>



                <Card>
                    <CardHeader>
                        <CardTitle>Images</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        onClick={() => router('/dashboard/all-vaccination')}
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

export default CreateVaccines;