import { Bell, LogOut, Menu, MessageSquare, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const DashboardHeader = ({ toggleMobileMenu, isMobileMenuOpen, user = null, logout = () => { console.log("logout") } }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    const imageUrl = imageError
        ? "https://res.cloudinary.com/dglihfwse/image/upload/v1745318543/user_2_pltaly.png"
        : user?.picture;

    return (
        <header className="bg-white border-b sticky top-0 z-10">
            <div className="container mx-auto px-4">
                <div className="flex h-15 items-center justify-between">
                    {/* Mobile Menu Button */}
                    <div className=" hidden md:flex invisible items-center">
                       

                    
                    </div>

                    {/* Notifications and User Dropdown */}
                    <div className="flex items-center space-x-4">
                        {/* Notification Button */}
                        <button className="relative p-1 rounded-full hover:bg-gray-100">
                            <Bell className="h-5 w-5 text-gray-600" />
                            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                        </button>

                        {/* User Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <img
                                    src={imageUrl || "https://res.cloudinary.com/dglihfwse/image/upload/v1745318543/user_2_pltaly.png"}
                                    alt="User"
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={handleImageError}
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.location.href = "/dashboard/Profile"}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <LogOut onClick={logout} className="mr-2 h-4 w-4" />
                                    <span onClick={logout}>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
