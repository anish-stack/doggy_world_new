

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X, Trash2, Edit, Save } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const CreateAndEditProductShop = () => {
   
    const getIdFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    };

    const id = getIdFromUrl();
    const isEditMode = !!id;

    // State management
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [mainImageFile, setMainImageFile] = useState(null);
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [activeTab, setActiveTab] = useState("basic");

    // Variant management
    const [sizeVariants, setSizeVariants] = useState("");
    const [priceVariants, setPriceVariants] = useState(0);
    const [discountPriceVariants, setDiscountPriceVariants] = useState(0);
    const [offPercentageVariants, setOffPercentageVariants] = useState(0);
    const [stockVariants, setStockVariants] = useState(0);
    const [inStockVariants, setInStockVariants] = useState(true);
    const [flavourVariants, setFlavourVariants] = useState("");
    const [removeImages, setRemoveImage] = useState([])

    const [editingVariantIndex, setEditingVariantIndex] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        isCod: true,
        isReturn: false,
        freshStock: true,
        flavour: '',
        tag: '',
        isProductAvailable: true,
        freeDelivery: true,
        variants: [],
        discountPrice: '',
        offPercentage: ''
    });

    // Calculate discount price when price or offPercentage changes
    useEffect(() => {
        if (formData.price && formData.offPercentage) {
            const discountedPrice = (formData.price - (formData.price * formData.offPercentage / 100)).toFixed(2);
            setFormData(prev => ({ ...prev, discountPrice: discountedPrice }));
        } else {
            setFormData(prev => ({ ...prev, discountPrice: '' }));
        }
    }, [formData.price, formData.offPercentage]);

    // Fetch categories and product details on component mount
    useEffect(() => {
        fetchCategories();
        if (isEditMode) {
            fetchProductDetails();
        }
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/v1/petshop-sub-category');
            if (response.data.data) {
                setCategories(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load categories');
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8000/api/v1/petshop-get-product/${id}`);
            const product = response.data.product;

            // Set form data
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                category: product.category?._id || '',
                isCod: product.isCod ?? true,
                isReturn: product.isReturn ?? false,
                freshStock: product.freshStock ?? true,
                flavour: product.flavour || '',
                tag: product.tag || '',
                isProductAvailable: product.isProductAvailable ?? true,
                freeDelivery: product.freeDelivery ?? true,
                variants: product.variants || [],
                discountPrice: product.discountPrice || '',
                offPercentage: product.offPercentage || ''
            });

            // Set image previews
            if (product.mainImage) {
                setMainImagePreview(product.mainImage.url);
            }

            if (product.imageUrl && product.imageUrl.length > 0) {
                const sortedImages = [...product.imageUrl].sort((a, b) => a.position - b.position);
                setImagePreviewUrls(sortedImages.map(img => ({
                    url: img.url,
                    public_id: img.public_id,
                    id: img._id
                })));
            }
        } catch (error) {
            toast.error('Failed to load product details');


            console.error("Error fetching product details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else if (name === 'price' || name === 'offPercentage') {
            // Ensure numeric values
            const numValue = parseFloat(value) || '';
            setFormData({ ...formData, [name]: numValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSelectChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSwitchChange = (name, checked) => {
        setFormData({ ...formData, [name]: checked });
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMainImageFile(file);
            setMainImagePreview(URL.createObjectURL(file));
        }
    };

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files);

        // Limit to 5 additional images
        const totalImages = imagePreviewUrls.length + files.length;
        if (totalImages > 5) {
            toast.warning('You can only upload up to 5 additional images');


            return;
        }

        // Create previews for the new files
        const newPreviewUrls = files.map(file => ({
            url: URL.createObjectURL(file),
            file: file,
            isNew: true
        }));

        // Update state
        setImageFiles(prev => [...prev, ...files]);
        setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const removeImage = (index) => {
        console.log("Removing image at index:", index);

        const newImagePreviewUrls = [...imagePreviewUrls];
        const removedImage = newImagePreviewUrls.splice(index, 1)[0];
        console.log("Removed image:", removedImage);
        setRemoveImage((prev) => [...prev, removedImage])

        setImagePreviewUrls(newImagePreviewUrls);
        console.log("Updated preview URLs:", newImagePreviewUrls);

        // If it's a new image (not yet uploaded), remove from imageFiles too
        if (removedImage.isNew) {
            console.log("Removed image is new, checking in imageFiles...");

            const newImageFiles = [...imageFiles];
            newImageFiles.forEach((file, i) => {
                console.log(`Checking file at index ${i}:`, file.name);
            });

            const fileIndex = newImageFiles.findIndex(file =>
                URL.createObjectURL(file) === removedImage.url
            );
            console.log("Matching file index in imageFiles:", fileIndex);

            if (fileIndex !== -1) {
                newImageFiles.splice(fileIndex, 1);
                setImageFiles(newImageFiles);
                console.log("Updated imageFiles after removal:", newImageFiles);
            } else {
                console.warn("Matching file not found in imageFiles.");
            }
        }
    };


    // Variant handling
    const addVariant = () => {
        if (!sizeVariants || !priceVariants) {
            toast.warning('Size and price are required');
            return;
        }

        const newVariant = {
            size: sizeVariants,
            price: parseFloat(priceVariants),
            discountPrice: parseFloat(discountPriceVariants) || 0,
            offPercentage: parseFloat(offPercentageVariants) || 0,
            stock: parseInt(stockVariants) || 0,
            inStock: Boolean(inStockVariants),
            flavour: flavourVariants
        };

        if (editingVariantIndex !== null) {
            // Update existing variant
            const updatedVariants = [...formData.variants];
            updatedVariants[editingVariantIndex] = newVariant;
            setFormData({ ...formData, variants: updatedVariants });
            setEditingVariantIndex(null);
        } else {
            // Add new variant
            setFormData({ ...formData, variants: [...formData.variants, newVariant] });
        }

        // Reset variant fields
        setSizeVariants("");
        setPriceVariants(0);
        setDiscountPriceVariants(0);
        setOffPercentageVariants(0);
        setStockVariants(0);
        setInStockVariants(true);
        setFlavourVariants("");
    };

    const editVariant = (index) => {
        const variant = formData.variants[index];
        setSizeVariants(variant.size || "");
        setPriceVariants(variant.price?.toString() || "0");
        setDiscountPriceVariants(variant.discountPrice?.toString() || "0");
        setOffPercentageVariants(variant.offPercentage?.toString() || "0");
        setStockVariants(variant.stock?.toString() || "0");
        setInStockVariants(variant.inStock ?? true);
        setFlavourVariants(variant.flavour || "");
        setEditingVariantIndex(index);
    };

    const removeVariant = (index) => {
        const updatedVariants = [...formData.variants];
        updatedVariants.splice(index, 1);
        setFormData({ ...formData, variants: updatedVariants });

        // Reset form if editing this one
        if (editingVariantIndex === index) {
            cancelVariantEdit();
        }
    };

    const cancelVariantEdit = () => {
        setSizeVariants("");
        setPriceVariants(0);
        setDiscountPriceVariants(0);
        setOffPercentageVariants(0);
        setStockVariants(0);
        setInStockVariants(true);
        setFlavourVariants("");
        setEditingVariantIndex(null);
    };


    const validateForm = () => {
        if (!formData.name) {
            toast.error('Product name is required');


            setActiveTab("basic");
            return false;
        }

        if (!formData.description) {
            toast.error('Product description is required');


            setActiveTab("basic");
            return false;
        }

        if (!formData.category) {
            toast.error('Please select a category');

            setActiveTab("basic");
            return false;
        }

        if (!formData.price) {
            toast.error('Product price is required');


            setActiveTab("pricing");
            return false;
        }



        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitLoading(true);

        try {
            const formDataToSend = new FormData();

            // Append all form fields
            Object.keys(formData).forEach(key => {
                if (key === 'variants') {
                    // Handle variants array
                    formDataToSend.append('variants', JSON.stringify(formData.variants));
                } else {
                    // Handle other fields
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Append main image if there's a new one
            if (mainImageFile) {
                formDataToSend.append('mainImage', mainImageFile);
            }

            // Append additional images
            imageFiles.forEach(file => {
                formDataToSend.append('images', file);
            });
            if (removeImages.length > 0) {
                formDataToSend.append('removeImages', JSON.stringify(removeImages));
            }

            let response;
            if (isEditMode) {
                response = await axios.post(`http://localhost:8000/api/v1/petshop-update-product/${id}`, formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                response = await axios.post('http://localhost:8000/api/v1/petshop-create-product', formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            toast.success(isEditMode ? "Product updated successfully" : "Product created successfully");
            console.log(response.data)
            // Navigate back to products list
            window.location.href = '/dashboard/pet-shop-product';
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");


            console.error("Error submitting form:", error);
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading product details...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                    <CardTitle className="text-2xl font-bold flex items-center">
                        {isEditMode ? 'Edit Product' : 'Create New Product'}
                        {formData.tag && (
                            <Badge className="ml-4" variant="outline">{formData.tag}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-4 mb-6">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="pricing">Pricing</TabsTrigger>
                            <TabsTrigger value="variants">Variants</TabsTrigger>
                            <TabsTrigger value="images">Images</TabsTrigger>
                        </TabsList>

                        {/* Basic Information Tab */}
                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="name" className="text-base font-medium">Product Name*</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter product name"
                                        className="mt-1"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="category" className="text-base font-medium">Category*</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => handleSelectChange('category', value)}
                                        required
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category._id} value={category._id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-base font-medium">Description*</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe your product in detail"
                                    className="mt-1"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="flavour" className="text-base font-medium">Flavour</Label>
                                    <Input
                                        id="flavour"
                                        name="flavour"
                                        value={formData.flavour}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Chocolate, Vanilla, etc."
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="tag" className="text-base font-medium">Tag</Label>
                                    <Input
                                        id="tag"
                                        name="tag"
                                        value={formData.tag}
                                        onChange={handleInputChange}
                                        placeholder="e.g., New Launch, Best Seller"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isProductAvailable"
                                        checked={formData.isProductAvailable}
                                        onCheckedChange={(checked) => handleSwitchChange('isProductAvailable', checked)}
                                    />
                                    <Label htmlFor="isProductAvailable">In Stock</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="freshStock"
                                        checked={formData.freshStock}
                                        onCheckedChange={(checked) => handleSwitchChange('freshStock', checked)}
                                    />
                                    <Label htmlFor="freshStock">Fresh Stock</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="freeDelivery"
                                        checked={formData.freeDelivery}
                                        onCheckedChange={(checked) => handleSwitchChange('freeDelivery', checked)}
                                    />
                                    <Label htmlFor="freeDelivery">Free Delivery</Label>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Pricing Tab */}
                        <TabsContent value="pricing" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="price" className="text-base font-medium">Regular Price (₹)*</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="Enter regular price"
                                        className="mt-1"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="offPercentage" className="text-base font-medium">Discount (%)</Label>
                                    <Input
                                        id="offPercentage"
                                        name="offPercentage"
                                        type="number"
                                        value={formData.offPercentage}
                                        onChange={handleInputChange}
                                        placeholder="Enter discount percentage"
                                        className="mt-1"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="discountPrice" className="text-base font-medium">Discounted Price (₹)</Label>
                                <Input
                                    id="discountPrice"
                                    name="discountPrice"
                                    type="number"
                                    value={formData.discountPrice}
                                    placeholder="Calculated automatically"
                                    className="mt-1 bg-gray-100"
                                    disabled
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Automatically calculated based on price and discount percentage
                                </p>
                            </div>

                            <Separator className="my-6" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isCod"
                                        checked={formData.isCod}
                                        onCheckedChange={(checked) => handleSwitchChange('isCod', checked)}
                                    />
                                    <Label htmlFor="isCod">Cash on Delivery</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isReturn"
                                        checked={formData.isReturn}
                                        onCheckedChange={(checked) => handleSwitchChange('isReturn', checked)}
                                    />
                                    <Label htmlFor="isReturn">Returnable</Label>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Variants Tab */}
                        <TabsContent value="variants" className="space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-4">Product Variants</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <Label htmlFor="sizeVariants">Size</Label>
                                        <Input
                                            id="sizeVariants"
                                            value={sizeVariants}
                                            onChange={(e) => setSizeVariants(e.target.value)}
                                            placeholder="e.g., Small, Medium, Large"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="priceVariants">Price (₹)</Label>
                                        <Input
                                            id="priceVariants"
                                            type="number"
                                            value={priceVariants}
                                            onChange={(e) => setPriceVariants(e.target.value)}
                                            placeholder="Enter price"
                                            className="mt-1"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="discountPriceVariants">Discount Price (₹)</Label>
                                        <Input
                                            id="discountPriceVariants"
                                            type="number"
                                            value={discountPriceVariants}
                                            onChange={(e) => setDiscountPriceVariants(e.target.value)}
                                            placeholder="Enter discount price"
                                            className="mt-1"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="offPercentageVariants">Off Percentage (%)</Label>
                                        <Input
                                            id="offPercentageVariants"
                                            type="number"
                                            value={offPercentageVariants}
                                            onChange={(e) => setOffPercentageVariants(e.target.value)}
                                            placeholder="Enter off percentage"
                                            className="mt-1"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="stockVariants">Stock</Label>
                                        <Input
                                            id="stockVariants"
                                            type="number"
                                            value={stockVariants}
                                            onChange={(e) => setStockVariants(e.target.value)}
                                            placeholder="Enter stock quantity"
                                            className="mt-1"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="inStockVariants">In Stock</Label>
                                        <Select
                                            value={inStockVariants.toString()}
                                            onValueChange={(val) => setInStockVariants(val === 'true')}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select stock status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">In Stock</SelectItem>
                                                <SelectItem value="false">Out of Stock</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="flavourVariants">Flavour</Label>
                                        <Input
                                            id="flavourVariants"
                                            value={flavourVariants}
                                            onChange={(e) => setFlavourVariants(e.target.value)}
                                            placeholder="e.g., Vanilla, Chocolate"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    <Button type="button" onClick={addVariant} className="flex items-center">
                                        {editingVariantIndex !== null ? (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Update Variant
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Variant
                                            </>
                                        )}
                                    </Button>

                                    {editingVariantIndex !== null && (
                                        <Button type="button" variant="outline" onClick={cancelVariantEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {formData.variants.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-6 bg-slate-100 dark:bg-slate-800 p-3 text-sm font-medium">
                                        <div>Size</div>
                                        <div>Price</div>
                                        <div>Discount</div>
                                        <div>Stock</div>
                                        <div>Flavour</div>
                                        <div className="text-right">Actions</div>
                                    </div>

                                    {formData.variants.map((variant, index) => (
                                        <div key={index} className="grid grid-cols-6 p-3 border-t items-center text-sm">
                                            <div>{variant.size}</div>
                                            <div>₹{variant.price.toFixed(2)}</div>
                                            <div>₹{variant.discountPrice || 0} ({variant.offPercentage}%)</div>
                                            <div>{variant.inStock ? `In Stock (${variant.stock})` : 'Out of Stock'}</div>
                                            <div>{variant.flavour || '-'}</div>
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => editVariant(index)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeVariant(index)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border rounded-lg bg-slate-50 dark:bg-slate-900">
                                    <p className="text-muted-foreground">No variants added yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Add variants if your product comes in different sizes, colors, or flavors
                                    </p>
                                </div>
                            )}
                        </TabsContent>


                        {/* Images Tab */}
                        <TabsContent value="images" className="space-y-6">


                            {/* Additional Images */}
                            <div>
                                <Label className="text-base font-medium">Products Images</Label>
                                <div className="mt-2 flex flex-wrap gap-4">
                                    {imagePreviewUrls.map((image, index) => (
                                        <div key={index} className="relative w-32 h-32 border rounded-lg overflow-hidden">
                                            <img
                                                src={image.url || "/placeholder.svg"}
                                                alt={`Product ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {imagePreviewUrls.length < 5 && (
                                        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Plus className="w-6 h-6 mb-1 text-gray-400" />
                                                <p className="text-xs text-center text-gray-500">Add more</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleImagesChange}
                                            />
                                        </label>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    You can upload up to 5 additional images
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 mt-8">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        All unsaved changes will be lost.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>No, continue editing</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => window.location.href = '/dashboard/pet-shop-product'}>
                                        Yes, discard changes
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button
                            onClick={handleSubmit}
                            disabled={submitLoading}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                            {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? 'Update Product' : 'Create Product'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateAndEditProductShop;
