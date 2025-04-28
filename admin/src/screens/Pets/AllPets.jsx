import { useState, useEffect } from "react";
import { API_URL, fetcher } from '@/constant/Urls';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { Loader2, Search, MoreHorizontal, Filter, Calendar, Phone, Check, X, Dog, Cat } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";

const AllPets = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [petTypeFilter, setPetTypeFilter] = useState("");
    const [verificationFilter, setVerificationFilter] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [isChangeNumberDialogOpen, setIsChangeNumberDialogOpen] = useState(false);
    const [isVerifyOtpDialogOpen, setIsVerifyOtpDialogOpen] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);
    const [otpValue, setOtpValue] = useState("");
    const [newNumber, setNewNumber] = useState("");
    const [currentNumber, setCurrentNumber] = useState("");
    const [petTypes, setPetTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form setup for update pet
    const updateForm = useForm({
        defaultValues: {
            petname: "",
            petbreed: "",
            petdob: "",
            petType: "",
            isGivePermisoonToSendNotification: false
        }
    });

    // Fetch pets data with SWR
    const { data, error, isValidating } = useSWR(
        `${API_URL}/all-pets?page=${currentPage}&search=${searchTerm}&petType=${petTypeFilter}&is_verify_pet=${verificationFilter}`,
        fetcher
    );

    // Fetch pet types separately
    useEffect(() => {
        const fetchPetTypes = async () => {
            try {
                const response = await axios.get(`${API_URL}/get-pet-type`);
                console.log(response.data.data)
                setPetTypes(response.data.data || []);
            } catch (error) {
                console.error("Error fetching pet types:", error);
            }
        };

        fetchPetTypes();
    }, []);

    // Handle pet deletion
    const handleDeletePet = async () => {
        if (!selectedPet) return;

        setIsLoading(true);
        try {
            await axios.delete(`${API_URL}/pet-profile/${selectedPet._id}`);
            toast.success(`${selectedPet.petname} has been removed from the system.`);
            mutate(`${API_URL}/all-pets?page=${currentPage}&search=${searchTerm}&petType=${petTypeFilter}&is_verify_pet=${verificationFilter}`);
            window.location.reload()
            setIsDeleteDialogOpen(false);
        } catch (error) {
            toast.error( error.response?.data?.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle pet update
    const handleUpdatePet = async (data) => {
        if (!selectedPet) return;

        setIsLoading(true);
        try {
            await axios.put(`${API_URL}/pet-profile/${selectedPet._id}`, data);
            toast.success(`${data.petname}'s information has been updated.`);
            mutate(`${API_URL}/all-pets?page=${currentPage}&search=${searchTerm}&petType=${petTypeFilter}&verified=${verificationFilter}`);
            setIsUpdateDialogOpen(false);
            window.location.reload()
        } catch (error) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle owner number change request
    const handleChangeOwnerNumber = async () => {
        if (!selectedPet || !currentNumber || !newNumber) return;

        setIsLoading(true);
        try {
            await axios.put(`${API_URL}/change-owner-number/${selectedPet._id}`, {
                currentNumber,
                newNumber
            });
            toast.success(`An OTP has been sent to ${newNumber}. Please verify to complete the number change.`,);
            setIsChangeNumberDialogOpen(false);
            setIsVerifyOtpDialogOpen(true);
        } catch (error) {
            toast.error(error.response?.data?.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle OTP verification for number change
    const handleVerifyOtp = async () => {
        if (!selectedPet || !otpValue || !newNumber) return;

        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/verify-number-change-otp/${selectedPet._id}`, {
                otp: otpValue,
                newNumber
            });
            toast.success(`Owner number for ${selectedPet.petname} has been updated.`);
            mutate(`${API_URL}/all-pets?page=${currentPage}&search=${searchTerm}&petType=${petTypeFilter}&verified=${verificationFilter}`);
            setIsVerifyOtpDialogOpen(false);
            window.location.reload()
            setOtpValue("");
        } catch (error) {
            toast.error(error.response?.data?.message);

        } finally {
            setIsLoading(false);
        }
    };

    // Set form values when selected pet changes
    useEffect(() => {
        if (selectedPet && isUpdateDialogOpen) {
            updateForm.reset({
                petname: selectedPet.petname,
                petbreed: selectedPet.petbreed,
                petdob: selectedPet.petdob ? selectedPet.petdob.split('T')[0] : "",
                petType: selectedPet.petType?._id || "",
                isGivePermisoonToSendNotification: selectedPet.isGivePermisoonToSendNotification
            });
        }

        if (selectedPet && isChangeNumberDialogOpen) {
            setCurrentNumber(selectedPet.petOwnertNumber);
        }
    }, [selectedPet, isUpdateDialogOpen, isChangeNumberDialogOpen]);

    // Format date for display
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), "MMM dd, yyyy");
        } catch (error) {
            return "N/A";
        }
    };

    // Open pet action dialogs
    const openActionDialog = (pet, action) => {
        setSelectedPet(pet);

        switch (action) {
            case "delete":
                setIsDeleteDialogOpen(true);
                break;
            case "update":
                setIsUpdateDialogOpen(true);
                break;
            case "changeNumber":
                setIsChangeNumberDialogOpen(true);
                break;
            default:
                break;
        }
    };

    // Calculate pagination details
    const totalPages = data?.data?.totalPages || 1;
    const paginationRange = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationRange.push(i);
    }

    if (error) return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Failed to load pets data. Please try again later.</p>
                <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">All Pets</h1>
                    <p className="text-muted-foreground">Manage all registered pets in the system.</p>
                </div>
            </div>

            {/* Search and Filter Section */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center space-x-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Dog className="h-4 w-4 text-muted-foreground" />
                            <Select value={petTypeFilter === "" ? "All" : petTypeFilter} onValueChange={(value) => setPetTypeFilter(value === "All" ? "" : value)}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Filter by pet type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Types</SelectItem>
                                    {petTypes.map((type) => (
                                        <SelectItem key={type._id} value={type._id}>
                                            {type.petType}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>


                        <div className="flex items-center space-x-2">
    <Check className="h-4 w-4 text-muted-foreground" />
    <Select
        value={verificationFilter === null ? "All" : verificationFilter === true ? "Verified" : "Not Verified"}
        onValueChange={(value) => setVerificationFilter(value === "All" ? null : value === "Verified")}
    >
        <SelectTrigger className="flex-1">
            <SelectValue placeholder="Verification status" />
        </SelectTrigger>
        <SelectContent>
         
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Not Verified">Not Verified</SelectItem>
        </SelectContent>
    </Select>
</div>


                        <Button variant="outline" onClick={() => {
                            setSearchTerm("");
                            setPetTypeFilter("");
                            setVerificationFilter("");
                            setCurrentPage(1);
                        }}>
                            Reset Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Pets Table */}
            <Card>
                <CardHeader className="px-6">
                    <CardTitle>Pets</CardTitle>
                    <CardDescription>
                        {data?.data?.totalPets || 0} pets found
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pet Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Breed</TableHead>
                                    <TableHead>Owner Number</TableHead>
                                    <TableHead>DOB</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isValidating && !data ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            <div className="flex justify-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground">Loading pets data...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : data?.data?.pets?.length > 0 ? (
                                    data.data.pets.map((pet) => (
                                        <TableRow key={pet._id}>
                                            <TableCell className="font-medium">{pet.petname}</TableCell>
                                            <TableCell>{pet.petType?.petType || "N/A"}</TableCell>
                                            <TableCell>{pet.petbreed}</TableCell>
                                            <TableCell>{pet.petOwnertNumber}</TableCell>
                                            <TableCell>{formatDate(pet.petdob)}</TableCell>
                                            <TableCell>
                                                {pet.is_verify_pet ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-orange-500 text-orange-500">
                                                        Not Verified
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openActionDialog(pet, "update")}>
                                                            Update Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openActionDialog(pet, "changeNumber")}>
                                                            Change Owner Number
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => openActionDialog(pet, "delete")}
                                                        >
                                                            Delete Pet
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            <p className="text-muted-foreground">No pets found</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                {/* Pagination */}
                {data?.data?.totalPages > 1 && (
                    <div className="flex items-center justify-end px-6 py-4">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {startPage > 1 && (
                                    <>
                                        <PaginationItem>
                                            <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                                        </PaginationItem>
                                        {startPage > 2 && (
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        )}
                                    </>
                                )}

                                {paginationRange.map(page => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            isActive={currentPage === page}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}

                                {endPage < totalPages && (
                                    <>
                                        {endPage < totalPages - 1 && (
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        )}
                                        <PaginationItem>
                                            <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                                                {totalPages}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </>
                                )}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </Card>

            {/* Delete Pet Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {selectedPet?.petname}'s profile and all associated data.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePet}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Pet"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Update Pet Dialog */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Pet Information</DialogTitle>
                        <DialogDescription>
                            Update {selectedPet?.petname}'s profile information.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...updateForm}>
                        <form onSubmit={updateForm.handleSubmit(handleUpdatePet)} className="space-y-4">
                            <FormField
                                control={updateForm.control}
                                name="petname"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pet Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Pet name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={updateForm.control}
                                name="petbreed"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pet Breed</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Pet breed" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={updateForm.control}
                                name="petdob"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date of Birth</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <Input type="date" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={updateForm.control}
                                name="petType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pet Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select pet type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {petTypes.map((type) => (
                                                    <SelectItem key={type._id} value={type._id}>
                                                        {type.petType}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={updateForm.control}
                                name="isGivePermisoonToSendNotification"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Allow notifications
                                            </FormLabel>
                                            <FormDescription>
                                                Send reminders and updates to pet owner
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Change Owner Number Dialog */}
            <Dialog open={isChangeNumberDialogOpen} onOpenChange={setIsChangeNumberDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change Owner Phone Number</DialogTitle>
                        <DialogDescription>
                            Update the contact number for {selectedPet?.petname}'s owner.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentNumber">Current Number</Label>
                            <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="currentNumber"
                                    value={currentNumber}
                                    onChange={(e) => setCurrentNumber(e.target.value)}
                                    placeholder="Current phone number"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newNumber">New Number</Label>
                            <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="newNumber"
                                    value={newNumber}
                                    onChange={(e) => setNewNumber(e.target.value)}
                                    placeholder="New phone number"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                An OTP will be sent to this number for verification.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleChangeOwnerNumber} disabled={isLoading || !currentNumber || !newNumber}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Send OTP"
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Verify OTP Dialog */}
            <Dialog open={isVerifyOtpDialogOpen} onOpenChange={setIsVerifyOtpDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Verify OTP</DialogTitle>
                        <DialogDescription>
                            Enter the OTP sent to {newNumber} to confirm the number change.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">One-Time Password</Label>
                            <Input
                                id="otp"
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value)}
                                placeholder="Enter OTP"
                                className="text-center text-lg tracking-widest"
                                maxLength={6}
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsVerifyOtpDialogOpen(false)} className="mr-2">
                                Cancel
                            </Button>
                            <Button onClick={handleVerifyOtp} disabled={isLoading || !otpValue}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify OTP"
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AllPets;