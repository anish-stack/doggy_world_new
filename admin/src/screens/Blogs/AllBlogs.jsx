import { useState, useEffect } from "react";
import axios from "axios";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
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
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreVertical, Edit, Trash2, Eye, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_URL } from "@/constant/Urls";

export default function AllBlogs() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredBlogs, setFilteredBlogs] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const navigate = useNavigate();

    // Get all blogs with pagination
    const fetchBlogs = async (page = 1) => {
        setLoading(true);

        try {
            const response = await axios.get(`${API_URL}/blogs?page=${page}&limit=10`);
            const blogData = response?.data?.data || response?.data?.data;



            if (response.data.success) {
                setBlogs(blogData);
                setFilteredBlogs(blogData);
                setTotalPages(response.data.totalPages);
                setCurrentPage(response.data.currentPage);
                setTotalItems(response.data.total);
            } else {
                toast.error(response.data.message || "Failed to fetch blogs");
            }
        } catch (error) {
            console.error("Error fetching blogs:", error);
            const errorMessage = error?.response?.data?.message || "Error fetching blogs";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs()
    }, [])
    // Filter blogs on search
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredBlogs(blogs);
        } else {
            const filtered = blogs.filter((blog) =>
                blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredBlogs(filtered);
        }
    }, [searchTerm, blogs]);

    // Delete blog
    const deleteBlog = async () => {
        if (!blogToDelete) return;

        setDeleteLoading(true);
        try {
            const response = await axios.delete(`${API_URL}/blogs/${blogToDelete._id}`);
            if (response.data.success) {
                toast.success("Blog deleted successfully");
                fetchBlogs(currentPage);
            } else {
                toast.error("Failed to delete blog");
            }
        } catch (error) {
            console.error("Error deleting blog:", error);
            toast.error("Error deleting blog");
        } finally {
            setDeleteLoading(false);
            setIsDeleteDialogOpen(false);
            setBlogToDelete(null);
        }
    };

    const handleDeleteClick = (blog) => {
        setBlogToDelete(blog);
        setIsDeleteDialogOpen(true);
    };

    const handleEditClick = (blog) => {
        navigate(`/dashboard/blogs/edit/${blog._id}`, { state: { blog } });
    };


    const handleCreateNew = () => {
        navigate("/dashboard/blogs/create");
    };

    const handlePageChange = (page) => {
        fetchBlogs(page);
    };

    // Function to truncate text
    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    };

    return (
        <div className="container mx-auto p-6">
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">Blogs</CardTitle>
                        <CardDescription>
                            Manage blog posts for your website
                        </CardDescription>
                    </div>
                    <Button onClick={handleCreateNew} className="flex items-center gap-2">
                        <Plus size={16} /> Create New Blog
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search blogs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Button variant="outline" onClick={() => fetchBlogs(currentPage)} className="flex items-center gap-2">
                            <RefreshCw size={16} /> Refresh
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center min-h-[300px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No blogs found</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Title</TableHead>
                                        <TableHead className="w-[120px]">Image</TableHead>
                                        <TableHead>Author</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Tags</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBlogs?.map((blog) => (
                                        <TableRow key={blog._id}>
                                            <TableCell className="font-medium">
                                                {truncateText(blog.title, 30)}
                                            </TableCell>
                                            <TableCell>
                                                {blog.imageUrl && blog.imageUrl.length > 0 ? (
                                                    <img
                                                        src={blog.imageUrl[0].url}
                                                        alt={`Blog ${blog.title}`}
                                                        className="h-16 w-24 object-cover rounded-md"
                                                    />
                                                ) : (
                                                    <div className="h-16 w-24 bg-gray-200 rounded-md flex items-center justify-center">
                                                        <span className="text-xs text-gray-500">No Image</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{blog.author}</TableCell>
                                            <TableCell>{blog.category}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {blog.tags?.slice(0, 2).map((tag, index) => (
                                                        <Badge key={index} variant="outline" className="bg-blue-50">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {blog.tags?.length > 2 && (
                                                        <Badge variant="outline" className="bg-blue-50">
                                                            +{blog.tags.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {blog.isPublished ? (
                                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center w-fit gap-1">
                                                        <CheckCircle size={14} /> Published
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center w-fit gap-1">
                                                        <XCircle size={14} /> Draft
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">

                                                        <DropdownMenuItem
                                                            onClick={() => handleEditClick(blog)}
                                                            className="cursor-pointer flex items-center gap-2"
                                                        >
                                                            <Edit size={14} /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(blog)}
                                                            className="cursor-pointer text-red-600 focus:text-red-600 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>

                                    {[...Array(totalPages)].map((_, i) => {
                                        // Show first page, last page, current page and one before/after current
                                        if (
                                            i === 0 ||
                                            i === totalPages - 1 ||
                                            i === currentPage - 1 ||
                                            i === currentPage - 2 ||
                                            i === currentPage
                                        ) {
                                            return (
                                                <PaginationItem key={i}>
                                                    <PaginationLink
                                                        onClick={() => handlePageChange(i + 1)}
                                                        isActive={currentPage === i + 1}
                                                    >
                                                        {i + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        } else if (
                                            (i === 1 && currentPage > 3) ||
                                            (i === totalPages - 2 && currentPage < totalPages - 2)
                                        ) {
                                            return (
                                                <PaginationItem key={i}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            );
                                        }
                                        return null;
                                    })}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}

                    {/* Results count */}
                    {!loading && (
                        <div className="text-sm text-muted-foreground mt-4">
                            Showing {filteredBlogs.length} of {totalItems} blog posts
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the blog post
                            {blogToDelete && ` "${truncateText(blogToDelete.title, 40)}"`}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteBlog}
                            disabled={deleteLoading}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {deleteLoading ? (
                                <>
                                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
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
}