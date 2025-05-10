const LabBooking = require("../../models/LabsTest/LabBooking");


exports.BookingOfLabTest = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      date, 
      search,
      status,
      bookingType,
      clinic,
      sortBy = 'createdAt',
      sortOrder = -1 
    } = req.query;


    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    

    const query = {};
    
    // Date filter
    if (date) {
      query.selectedDate = date;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Booking type filter
    if (bookingType) {
      query.bookingType = bookingType;
    }
    
    // Clinic filter
    if (clinic) {
      query.clinic = clinic;
    }
    
  
    if (search) {
      query.$or = [
        { bookingRef: { $regex: search, $options: 'i' } },
       
      ];
      
      // If search might be an ObjectId (for pet or other relations)
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ pet: search });
        query.$or.push({ _id: search });
      }
    }

   
    const skip = (pageNum - 1) * limitNum;
  
    const totalBookings = await LabBooking.countDocuments(query);
 
    const bookings = await LabBooking.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limitNum)
      .populate('pet', 'petname petOwnertNumber') 
      .populate('Address') 
      .populate('labTests', 'mainImage title price discount_price home_price_of_package home_price_of_package_discount') // Populate lab test details
      .populate('clinic', 'clinicName address')
      .populate('payment', 'forWhat amount  razorpay_payment_id payment_status'); // Populate payment info
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalBookings / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
  
    return res.status(200).json({
      success: true,
      message: 'Lab test bookings fetched successfully',
      data: {
        bookings,
        pagination: {
          totalBookings,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          date,
          status,
          bookingType,
          clinic,
          search
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching lab test bookings:', error);
    
    // Check if error is validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: Object.values(error.errors).map(err => err.message),
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Check if error is cast error (invalid ID format)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path} format`,
        code: 'INVALID_ID_FORMAT'
      });
    }
    
    // Default error response
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch lab test bookings',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};