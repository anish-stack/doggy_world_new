import React, { useState } from 'react';
import useSWR from 'swr';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Trash2, PenSquare, Eye, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

// Fetcher function for SWR
const fetcher = (...args) => fetch(...args).then(res => res.json());

const AllVaccines = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = new URLSearchParams(location.search);
    const page = queryParams.get('page') || 1;
    const currentPage = Number(page);

    const [expandedRows, setExpandedRows] = useState({});

    // SWR hook to fetch vaccine products
    const { data, error, mutate } = useSWR(
        `http://localhost:8000/api/v1/vaccine-products?page=${currentPage}`,
        fetcher
    );

    const isLoading = !data && !error;

    // Function to handle delete
    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/vaccine-delete-product/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Revalidate the data after deletion
                window.location.reload()
                mutate();
            } else {
                console.error('Failed to delete the product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    // Functions to navigate to edit and create pages
    const navigateToEdit = (id) => {
        navigate(`/dashboard/edit-vaccination-product/${id}`);
    };

    const navigateToCreate = () => {
        navigate('/dashboard/create-vaccination-product');
    };

    // Toggle expanded row details
    const toggleRowDetails = (rowId) => {
        setExpandedRows(prev => ({
            ...prev,
            [rowId]: !prev[rowId]
        }));
    };

    // Generate pagination links
    const renderPagination = () => {
        if (!data || !data.pagination) return null;

        const { totalPages, currentPage } = data.pagination;

        return (
            <Pagination className="mt-4">
                <PaginationContent>
                    {currentPage > 1 && (
                        <PaginationItem>
                            <PaginationPrevious href={`?page=${currentPage - 1}`} />
                        </PaginationItem>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <PaginationItem key={pageNum}>
                            <PaginationLink
                                href={`?page=${pageNum}`}
                                isActive={pageNum === currentPage}
                            >
                                {pageNum}
                            </PaginationLink>
                        </PaginationItem>
                    ))}

                    {currentPage < totalPages && (
                        <PaginationItem>
                            <PaginationNext href={`?page=${currentPage + 1}`} />
                        </PaginationItem>
                    )}
                </PaginationContent>
            </Pagination>
        );
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Vaccine Products Management</h1>
                <Button onClick={navigateToCreate} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add New Vaccine
                </Button>
            </div>

            {isLoading && <div className="text-center py-8">Loading vaccine products...</div>}

            {error && (
                <div className="text-center py-8 text-red-500">
                    Error loading vaccine products. Please try again.
                </div>
            )}

            {data && data.data && data.data.length > 0 && (
                <div className="overflow-x-auto bg-white ">
                    <Table className="w-full border-collapse">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>For</TableHead>
                                <TableHead>Age Group</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.map((vaccine) => (
                                <React.Fragment key={vaccine._id}>
                                    <TableRow className="hover:bg-muted/50">
                                        <TableCell className="p-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRowDetails(vaccine._id)}
                                                className="p-0 h-6 w-6"
                                            >
                                                {expandedRows[vaccine._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <img
                                                src={vaccine.mainImage?.url || "/api/placeholder/400/320"}
                                                alt={vaccine.title}
                                                className="w-16 h-16 object-cover rounded-md"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{vaccine.title}</span>
                                                {vaccine.tag && <Badge className="w-fit mt-1">{vaccine.tag}</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>₹{vaccine.price}</span>
                                                {vaccine.discount_price > 0 && (
                                                    <span className="text-green-600 text-xs">Discount: ₹{vaccine.discount_price}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={vaccine.is_active ? "success" : "destructive"}>
                                                {vaccine.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {vaccine.is_dog && <Badge variant="outline">Dogs</Badge>}
                                                {vaccine.is_cat && <Badge variant="outline">Cats</Badge>}
                                                {vaccine.is_popular && (
                                                    <Badge variant="secondary" className="mt-1">Popular</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{vaccine.forage || "Not specified"}</TableCell>
                                        <TableCell>{vaccine.position}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => navigateToEdit(vaccine._id)}>
                                                    <PenSquare size={16} />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm">
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the vaccine product.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(vaccine._id)}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>

                                    {/* Expanded row details */}
                                    {expandedRows[vaccine._id] && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="p-0 border-b-0">
                                                <div className="bg-muted/30 p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {/* Details column */}
                                                        <Card>
                                                            <CardContent className="pt-4">
                                                                <h4 className="font-semibold mb-2">Details</h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <p className="truncate whitespace-nowrap overflow-hidden">
                                                                        <span className="font-medium">Short Description:</span> {vaccine.small_desc}
                                                                    </p>
                                                                    <p className="truncate whitespace-nowrap overflow-hidden">
                                                                        <span className="font-medium">Full Description:</span> {vaccine.desc}
                                                                    </p>

                                                                    {vaccine.is_package && (
                                                                        <>
                                                                            <p><span className="font-medium">Home Price:</span> ₹{vaccine.home_price_of_package}</p>
                                                                            <p><span className="font-medium">Home Price Discount:</span> ₹{vaccine.home_price_of_package_discount}</p>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>

                                                        {/* Vaccinations Included */}
                                                        <Card>
                                                            <CardContent className="pt-4">
                                                                <h4 className="font-semibold mb-2">Vaccinations Included</h4>
                                                                {vaccine.VaccinedInclueds && vaccine.VaccinedInclueds.length > 0 ? (
                                                                    <ul className="list-disc pl-5">
                                                                        {vaccine.VaccinedInclueds.map((item, idx) => (
                                                                            <li key={idx}>{item}</li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-sm text-gray-500">No vaccinations specified</p>
                                                                )}
                                                            </CardContent>
                                                        </Card>

                                                        {/* Vaccination Types */}
                                                        <Card>
                                                            <CardContent className="pt-4">
                                                                <h4 className="font-semibold mb-2">Vaccination Types</h4>
                                                                {vaccine.WhichTypeOfvaccinations && vaccine.WhichTypeOfvaccinations.length > 0 ? (
                                                                    <div className="space-y-2">
                                                                        {vaccine.WhichTypeOfvaccinations.map((type) => (
                                                                            <div key={type._id} className="flex items-center space-x-2 p-2 border rounded-md">
                                                                                {type.image?.url && (
                                                                                    <img
                                                                                        src={type.image.url}
                                                                                        alt={type.title}
                                                                                        className="w-10 h-10 rounded-md object-cover"
                                                                                    />
                                                                                )}
                                                                                <div>
                                                                                    <p className="font-medium text-sm">{type.title}</p>
                                                                                    <p className="text-xs text-gray-500 line-clamp-1">{type.description}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-gray-500">No vaccination types specified</p>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    </div>

                                                    {/* Images gallery */}
                                                    {vaccine.image && vaccine.image.length > 0 && (
                                                        <div className="mt-4">
                                                            <h4 className="font-semibold mb-3">Product Images</h4>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                                {vaccine.image.map((img) => (
                                                                    <div key={img._id} className="relative">
                                                                        <img
                                                                            src={img.url}
                                                                            alt={`Product image ${img.position}`}
                                                                            className="aspect-square w-full object-cover rounded-md border"
                                                                        />
                                                                        <Badge className="absolute bottom-1 right-1 bg-black/70">
                                                                            {img.position}
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {data && data.data && data.data.length === 0 && (
                <div className="text-center py-8">
                    No vaccine products found. Create a new one to get started.
                </div>
            )}

            {renderPagination()}
        </div>
    );
};

export default AllVaccines;