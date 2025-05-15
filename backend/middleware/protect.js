const ClinicRegister = require("../models/ClinicRegister/ClinicRegister");
const PetRegister = require("../models/petAndAuth/petregister");
const AppError = require("../utils/ApiError");
const { verifyToken } = require("../utils/sendToken");

exports.isAuthenticated = async (req, res, next) => {
  try {
    let token;


    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } 

    else if (req.cookies && req.cookies._usertoken) {
      token = req.cookies._usertoken;
    }

    if (!token) {
      return next(
        new AppError("You are not logged in. Please login to access this resource", 401)
      );
    }

    // Verify token
    const decoded = verifyToken(token); // Assumes this throws on failure
    if (!decoded?.id) {
      return next(new AppError("Invalid token. Please log in again", 401));
    }

    // Look for user in ClinicRegister first
    let user = await ClinicRegister.findById(decoded.id);

    // If not found, try PetRegister
    if (!user) {
      user = await PetRegister.findById(decoded.id);
    }

    // If still not found
    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return next(new AppError("Authentication failed. Please log in again", 401));
  }
};

// Authorization middleware based on roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role (${req.user?.role || "Unknown"}) is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
