
import { useState, useEffect } from "react"
import axios from "axios"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Plus, MoreVertical, Edit, Trash2, Eye, Filter, RefreshCw, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const PetShopProducts = () => {
  // State management
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [categories, setCategories] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [deleteLoading, setDeleteLoading] = useState(false)

  const router = useNavigate()

  // Fetch products on component mount and when dependencies change
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [currentPage, itemsPerPage, sortField, sortDirection, selectedCategory])

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await axios.get("http://localhost:8000/api/v1/petshop-get-product")

      if (response.data.success) {
        let filteredProducts = response.data.products.filter(product => product._id) // Filter out empty objects

        // Apply category filter if selected
        if (selectedCategory && selectedCategory !== "all") {
          filteredProducts = filteredProducts.filter(product =>
            product.category && product.category._id === selectedCategory
          );
        }


        // Apply search filter
        if (searchTerm) {
          filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.flavour?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Apply sorting
        filteredProducts.sort((a, b) => {
          let aValue = a[sortField]
          let bValue = b[sortField]

          // Handle nested fields like category.title
          if (sortField === "category") {
            aValue = a.category?.title || ""
            bValue = b.category?.title || ""
          }

          if (typeof aValue === 'string') {
            if (sortDirection === "asc") {
              return aValue.localeCompare(bValue)
            } else {
              return bValue.localeCompare(aValue)
            }
          } else {
            if (sortDirection === "asc") {
              return aValue - bValue
            } else {
              return bValue - aValue
            }
          }
        })

        // Calculate pagination
        const totalItems = filteredProducts.length
        setTotalPages(Math.ceil(totalItems / itemsPerPage))

        // Slice for current page
        const startIndex = (currentPage - 1) * itemsPerPage
        const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

        setProducts(paginatedProducts)
      } else {
        toast.error('Failed to fetch products')
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error('Failed to fetch products. Please try again.')

    } finally {
      setLoading(false)
    }
  }

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/v1/petshop-sub-category")
      if (response.data.data) {
        setCategories(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  // Handle search input change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page on new search
  }

  // Apply search filter
  const applySearch = () => {
    fetchProducts()
  }

  // Handle sort change
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle category filter change
  const handleCategoryChange = (value) => {
    console.log('value', value)
    setSelectedCategory(value)
    setCurrentPage(1) // Reset to first page on filter change
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setSortField("name")
    setSortDirection("asc")
    setSelectedCategory("")
    setCurrentPage(1)
  }

  // Handle checkbox selection
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  // Handle select all products
  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(product => product._id))
    }
  }

  // Navigate to create product page
  const handleCreateProduct = () => {
    router("/dashboard/create-and-edit-pet-shop-categories")
  }

  // Navigate to edit product page
  const handleEditProduct = (productId) => {
    router(`/dashboard/create-and-edit-pet-shop-categories?id=${productId}`)
  }

  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    try {
      setDeleteLoading(true)
      await axios.delete(`http://localhost:8000/api/v1/delete-shop-product/${productId}`)

      toast.success('Product deleted successfully')


      // Refresh product list
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error('Failed to delete product')


    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return

    try {
      setDeleteLoading(true)

      // Sequential deletion for each selected product
      for (const productId of selectedProducts) {
        await axios.delete(`http://localhost:8000/api/v1/delete-shop-product/${productId}`)
      }
      toast.success(`${selectedProducts.length} products deleted successfully`)


      // Clear selection and refresh
      setSelectedProducts([])
      fetchProducts()
    } catch (error) {
      console.error("Error in bulk delete:", error)
      toast.success(`Failed to delete some products`)


    } finally {
      setDeleteLoading(false)
    }
  }


  const handleViewProduct = (productId) => {
    // This would typically navigate to a product detail page
    router(`/dashboard/view-product/${productId}`)
  }

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = []

    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || loading}
        />
      </PaginationItem>
    )

    // First page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink
          isActive={currentPage === 1}
          onClick={() => setCurrentPage(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    )

    // Ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Pages around current
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Last page if not first page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || loading}
        />
      </PaginationItem>
    )

    return items
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Pet Shop Products</CardTitle>
            <CardDescription>
              Manage your pet shop product catalog
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleCreateProduct}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>

            {selectedProducts.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedProducts.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete {selectedProducts.length} selected products.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex w-full md:w-1/3 items-center space-x-2">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="flex-1"
              />
              <Button variant="outline" onClick={applySearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-1 flex-col sm:flex-row gap-2">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>


              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters} className="ml-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Products Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                      {sortField === "name" && (
                        <span className="ml-1 text-xs">
                          ({sortDirection === "asc" ? "A-Z" : "Z-A"})
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                    <div className="flex items-center">
                      Category
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("price")}>
                    <div className="flex items-center">
                      Price
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Loading products...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product._id)}
                          onCheckedChange={() => handleSelectProduct(product._id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-12 h-12 rounded-md overflow-hidden">
                          {product.mainImage ? (
                            <img
                              src={product.mainImage.url || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = "/placeholder.svg?height=48&width=48"
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                              No image
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {truncateText(product.description, 40)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(product.price)}</div>
                        {product.discountPrice && (
                          <div className="text-sm">
                            <span className="text-muted-foreground line-through mr-1">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-green-600 font-medium">
                              {product.offPercentage}% off
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isProductAvailable ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="mr-1 h-3 w-3" /> In Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="mr-1 h-3 w-3" /> Out of Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.tag && (
                            <Badge variant="secondary" className="text-xs">
                              {product.tag}
                            </Badge>
                          )}
                          {product.flavour && (
                            <Badge variant="outline" className="text-xs">
                              {product.flavour}
                            </Badge>
                          )}
                        </div>
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
                            <DropdownMenuItem onClick={() => handleViewProduct(product._id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProduct(product._id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {product.name}. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product._id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs whitespace-nowrap text-muted-foreground">
              Showing {products.length} of {totalPages * itemsPerPage} items
            </div>
            <Pagination>
              <PaginationContent>
                {generatePaginationItems()}
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PetShopProducts
