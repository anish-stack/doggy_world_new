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
  PaginationEllipsis,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreVertical, Edit, Trash2, Eye, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_URL } from "@/constant/Urls";

export default function AllHomeBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBanners, setFilteredBanners] = useState([]);

  const navigate = useNavigate();

  // Get all banners
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/home-banner`);
      if (response.data.success) {
        setBanners(response.data.data);
        setFilteredBanners(response.data.data);
      } else {
        toast.error("Failed to fetch banners");
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Error fetching banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Filter banners on search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBanners(banners);
    } else {
      const filtered = banners.filter((banner) => 
        banner.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.position.toString().includes(searchTerm)
      );
      setFilteredBanners(filtered);
    }
  }, [searchTerm, banners]);

  // Delete banner
  const deleteBanner = async () => {
    if (!bannerToDelete) return;
    
    setDeleteLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/home-banner/${bannerToDelete._id}`);
      if (response.data.success) {
        toast.success("Banner deleted successfully");
        fetchBanners();
      } else {
        toast.error("Failed to delete banner");
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Error deleting banner");
    } finally {
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  const handleDeleteClick = (banner) => {
    setBannerToDelete(banner);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = (banner) => {
    navigate(`/dashboard/banners/home/edit/${banner._id}`, { state: { banner } });
  };

  const handleCreateNew = () => {
    navigate("/dashboard/banners/home/create");
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Home Banners</CardTitle>
            <CardDescription>
              Manage banners displayed on the home page
            </CardDescription>
          </div>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus size={16} /> Add New Banner
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search banners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={fetchBanners} className="flex items-center gap-2">
              <RefreshCw size={16} /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No banners found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Position</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner) => (
                    <TableRow key={banner._id}>
                      <TableCell className="font-medium">{banner.position}</TableCell>
                      <TableCell>
                        {banner.imageUrl && banner.imageUrl.url ? (
                          <img
                            src={banner.imageUrl.url}
                            alt={`Banner ${banner.position}`}
                            className="h-16 w-32 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-16 w-32 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-xs text-gray-500">No Image</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{banner.link}</TableCell>
                      <TableCell>
                        {banner.isActive ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center w-fit gap-1">
                            <CheckCircle size={14} /> Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center w-fit gap-1">
                            <XCircle size={14} /> Inactive
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
                              onClick={() => handleEditClick(banner)}
                              className="cursor-pointer flex items-center gap-2"
                            >
                              <Edit size={14} /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(banner)}
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the banner 
              {bannerToDelete && ` at position ${bannerToDelete.position}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBanner}
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