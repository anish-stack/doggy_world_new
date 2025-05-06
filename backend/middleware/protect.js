const ClinicRegister = require("../models/ClinicRegister/ClinicRegister");
const AppError = require("../utils/ApiError");
const { verifyToken } = require("../utils/sendToken");

exports.isAuthenticated = async (req, res, next) => {
  try {
    let token;
    
    // Get token from authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Or get from cookie
    else if (req.cookies._usertoken) {
      token = req.cookies._usertoken;
    }

    // Check if token exists
    if (!token) {
      return next(new AppError('You are not logged in. Please login to access this resource', 401));
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user still exists
    const user = await ClinicRegister.findById(decoded.id);
    
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return next(new AppError('Authentication failed. Please log in again', 401));
  }
};

// Authorization middleware based on roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role (${req.user.role}) is not allowed to access this resource`, 403));
    }
    next();
  };
};