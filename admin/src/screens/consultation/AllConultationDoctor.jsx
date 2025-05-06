import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreVertical, Edit, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { API_URL } from "@/constant/Urls"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const AllConsultationDoctor = () => {
    const navigate = useNavigate();

    // State management
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [totalDoctors, setTotalDoctors] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("add"); // "add" or "edit"
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [filterStatus, setFilterStatus] = useState("all");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        image: null,
        discount: 0,
        price: 200,
        status: "active",
        position: 1,
        tags: "",
        availableTimeSlots: []
    });

    // Time slot state
    const [timeSlot, setTimeSlot] = useState({
        whichPart: "Morning",
        startTime: "",
        endTime: ""
    });

    // Edit ID
    const [editId, setEditId] = useState(null);

    // Fetch doctors
    useEffect(() => {
        fetchDoctors();
    }, [currentPage, searchTerm, filterStatus, refreshTrigger]);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/consultation-doctor`, {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: searchTerm,
                    status: filterStatus !== "all" ? filterStatus : undefined
                }
            });

            if (response.data.success) {
                setDoctors(response.data.data);
                setTotalDoctors(response.data.count);
            } else {
                toast.error("Failed to fetch doctors");
            }
        } catch (error) {
            console.error("Error fetching doctors:", error);
            toast.error("Failed to fetch doctors");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
        toast.success("Refreshed data");
    };

    const handleFilterChange = (value) => {
        setFilterStatus(value);
        setCurrentPage(1);
    };

    // Form handlers
    const handleFormChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === "file") {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleTimeSlotChange = (e) => {
        const { name, value } = e.target;
        setTimeSlot(prev => ({ ...prev, [name]: value }));
    };

    const addTimeSlot = () => {
        if (!timeSlot.startTime || !timeSlot.endTime) {
            toast.error("Please select both start and end times");
            return;
        }

        setFormData(prev => ({
            ...prev,
            availableTimeSlots: [
                ...prev.availableTimeSlots,
                {
                    whichPart: timeSlot.whichPart,
                    startTime: timeSlot.startTime,
                    endTime: timeSlot.endTime
                }
            ]
        }));

        // Reset time slot form
        setTimeSlot({
            whichPart: "Morning",
            startTime: "",
            endTime: ""
        });
    };

    const removeTimeSlot = (index) => {
        setFormData(prev => ({
            ...prev,
            availableTimeSlots: prev.availableTimeSlots.filter((_, i) => i !== index)
        }));
    };

    const openAddForm = () => {
        setFormData({
            name: "",
            image: null,
            discount: 0,
            price: 200,
            status: "active",
            position: 1,
            tags: "",
            availableTimeSlots: []
        });
        setFormMode("add");
        setIsFormOpen(true);
    };

    const openEditForm = (doctor) => {
        console.log('openEditForm')
        setFormData({
            name: doctor.name,
            image: null, // Can't pre-fill file input
            discount: doctor.discount,
            price: doctor.price,
            status: doctor.status,
            position: doctor.position,
            tags: doctor.tags.join(", "),
            availableTimeSlots: doctor.availableTimeSlots.map(slot => ({
                whichPart: slot.whichPart,
                startTime: slot.startTime,
                endTime: slot.endTime
            }))
        });
        setEditId(doctor._id);
        setFormMode("edit");
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formDataObj = new FormData();
        formDataObj.append("name", formData.name);
        formDataObj.append("discount", formData.discount);
        formDataObj.append("price", formData.price);
        formDataObj.append("status", formData.status);
        formDataObj.append("position", formData.position);

        // Handle tags
        const tagsArray = formData.tags
            .split(",")
            .map(tag => tag.trim())
            .filter(tag => tag);

        tagsArray.forEach(tag => {
            formDataObj.append("tags", tag);
        });

        // Handle time slots
        formData.availableTimeSlots.forEach((slot, index) => {
            formDataObj.append(`availableTimeSlots[${index}][whichPart]`, slot.whichPart);
            formDataObj.append(`availableTimeSlots[${index}][startTime]`, slot.startTime);
            formDataObj.append(`availableTimeSlots[${index}][endTime]`, slot.endTime);
        });

        // Only append image if it exists (for adding or updating)
        if (formData.image) {
            formDataObj.append("image", formData.image);
        }

        try {
            let response;

            if (formMode === "add") {
                response = await axios.post(`${API_URL}/consultation-doctor`, formDataObj);
            } else {
                response = await axios.post(`${API_URL}/consultation-doctor/${editId}`, formDataObj);
            }

            if (response.data.success) {
                toast.success(formMode === "add" ? "Doctor added successfully" : "Doctor updated successfully");
                setIsFormOpen(false);
                setRefreshTrigger(prev => prev + 1);
            } else {
                toast.error(formMode === "add" ? "Failed to add doctor" : "Failed to update doctor");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error(formMode === "add" ? "Failed to add doctor" : "Failed to update doctor");
        } finally {
            setLoading(false);
        }
    };

    const openDeleteDialog = (id) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await axios.delete(`${API_URL}/consultation-doctor/${deleteId}`);

            if (response.data.success) {
                toast.success("Doctor deleted successfully");
                setIsDeleteDialogOpen(false);
                setRefreshTrigger(prev => prev + 1);
            } else {
                toast.error("Failed to delete doctor");
            }
        } catch (error) {
            console.error("Error deleting doctor:", error);
            toast.error("Failed to delete doctor");
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    // Pagination
    const totalPages = Math.ceil(totalDoctors / itemsPerPage);

    const renderPaginationItems = () => {
        const items = [];

        // Previous button
        items.push(
            <PaginationItem key="prev">
                <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                />
            </PaginationItem>
        );

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            // Show first page, current page, last page, and one page before and after current
            if (
                i === 1 ||
                i === totalPages ||
                i === currentPage ||
                i === currentPage - 1 ||
                i === currentPage + 1
            ) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={currentPage === i}
                            onClick={() => setCurrentPage(i)}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            } else if (
                (i === currentPage - 2 && currentPage > 3) ||
                (i === currentPage + 2 && currentPage < totalPages - 2)
            ) {
                items.push(
                    <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
        }

        // Next button
        items.push(
            <PaginationItem key="next">
                <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                />
            </PaginationItem>
        );

        return items;
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Consultation Doctors</CardTitle>
                        <CardDescription>Manage all available consultation doctors</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button onClick={openAddForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Doctor
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search doctors..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="status-filter">Status:</Label>
                            <select
                                id="status-filter"
                                className="border rounded px-2 py-1"
                                value={filterStatus}
                                onChange={(e) => handleFilterChange(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Time Slots</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-10">
                                            <div className="flex justify-center">
                                                <RefreshCw className="h-6 w-6 animate-spin" />
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground">Loading doctors...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : doctors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-10">
                                            <p className="text-muted-foreground">No doctors found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    doctors.map((doctor) => (
                                        <TableRow key={doctor._id}>
                                            <TableCell>
                                                <img
                                                    src={doctor.image.url}
                                                    alt={doctor.name}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{doctor.name}</TableCell>
                                            <TableCell>₹{doctor.price}</TableCell>
                                            <TableCell>₹{doctor.discount}</TableCell>
                                            <TableCell>{doctor.position}</TableCell>
                                            <TableCell>
                                                <Badge variant={doctor.status === "active" ? "success" : "destructive"}>
                                                    {doctor.status === "active" ? (
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                    ) : (
                                                        <XCircle className="mr-1 h-3 w-3" />
                                                    )}
                                                    {doctor.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {doctor.tags && doctor.tags.length > 0 ? (
                                                        doctor.tags.map((tag, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                                                            No tags
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {doctor.availableTimeSlots.length > 0 ? (
                                                    <Badge variant="secondary">{doctor.availableTimeSlots.length} slots</Badge>
                                                ) : (
                                                    <Badge variant="outline">No slots</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditForm(doctor)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => openDeleteDialog(doctor._id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    {renderPaginationItems()}
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Doctor Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{formMode === "add" ? "Add New Doctor" : "Edit Doctor"}</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to {formMode === "add" ? "add a new doctor" : "update doctor information"}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Doctor Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Doctor Image {formMode === "add" && <span className="text-red-500">*</span>}</Label>
                                <Input
                                    id="image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFormChange}
                                    required={formMode === "add"}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price <span className="text-red-500">*</span></Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="200"
                                    value={formData.price}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="discount">Discount</Label>
                                <Input
                                    id="discount"
                                    name="discount"
                                    type="number"
                                    min="0"
                                    value={formData.discount}
                                    onChange={handleFormChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="position">Position <span className="text-red-500">*</span></Label>
                                <Input
                                    id="position"
                                    name="position"
                                    type="number"
                                    min="1"
                                    value={formData.position}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="status">Status</Label>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="status"
                                            name="status"
                                            checked={formData.status === "active"}
                                            onCheckedChange={(checked) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    status: checked ? "active" : "inactive"
                                                }));
                                            }}
                                        />
                                        <Label htmlFor="status">{formData.status === "active" ? "Active" : "Inactive"}</Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input
                                id="tags"
                                name="tags"
                                value={formData.tags}
                                onChange={handleFormChange}
                                placeholder="Cardiology, Heart Specialist, Senior Consultant"
                            />
                        </div>

                        {/* Time Slots Section */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex justify-between items-center">
                                <Label>Available Time Slots</Label>
                                <Badge variant="outline">{formData.availableTimeSlots.length} slots added</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="whichPart">Part of Day</Label>
                                    <select
                                        id="whichPart"
                                        name="whichPart"
                                        className="w-full border rounded px-3 py-2"
                                        value={timeSlot.whichPart}
                                        onChange={handleTimeSlotChange}
                                    >
                                        <option value="Morning">Morning</option>
                                        <option value="Afternoon">Afternoon</option>
                                        <option value="Evening">Evening</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        name="startTime"
                                        type="time"
                                        value={timeSlot.startTime}
                                        onChange={handleTimeSlotChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input
                                        id="endTime"
                                        name="endTime"
                                        type="time"
                                        value={timeSlot.endTime}
                                        onChange={handleTimeSlotChange}
                                    />
                                </div>

                                <div className="flex items-end">
                                    <Button type="button" onClick={addTimeSlot}>
                                        Add Time Slot
                                    </Button>
                                </div>
                            </div>

                            {formData.availableTimeSlots.length > 0 && (
                                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Part of Day</TableHead>
                                                <TableHead>Start Time</TableHead>
                                                <TableHead>End Time</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {formData.availableTimeSlots.map((slot, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{slot.whichPart}</TableCell>
                                                    <TableCell>
                                                        {slot.startTime}
                                                    </TableCell>
                                                    <TableCell>
                                                        {slot.endTime}

                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeTimeSlot(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFormOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        {formMode === "add" ? "Adding..." : "Updating..."}
                                    </>
                                ) : (
                                    formMode === "add" ? "Add Doctor" : "Update Doctor"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the doctor from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            {loading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AllConsultationDoctor;