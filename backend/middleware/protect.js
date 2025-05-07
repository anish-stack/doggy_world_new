const ClinicRegister = require("../models/ClinicRegister/ClinicRegister");
const PetRegister = require("../models/petAndAuth/petregister");
const AppError = require("../utils/ApiError");
const { verifyToken } = require("../utils/sendToken");

exports.isAuthenticated = async (req, res, next) => {
  try {
    let token;
    
    // Get token from authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log("token",token)
    } 
    // Or get from cookie
    else if (req.cookies._usertoken) {
      token = req.cookies._usertoken;
      console.log("token",token)
    }

    // Check if token exists
    if (!token) {
      console.log("token",token)
      return next(new AppError('You are not logged in. Please login to access this resource', 401));
    }

         console.log("token",token)
    // Verify token
    const decoded = verifyToken(token);
    console.log("decoded",decoded)
    // Check if user still exists
    let user = await ClinicRegister.findById(decoded.id);
    
    if (!user) {
      user = await PetRegister.findById(decoded.id);
      
    }else{
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