const BookingPhysioModel = require("../../models/PhysioTherapy/BookingPhysio.model");


exports.AllBookingsOfPhysio = async (req, res) => {
    try {
        const { date } = req.params;
        const dateForm = new Date(date).toISOString().split('T')[0];
      
        const BookingOfPhsyio = await BookingPhysioModel.find({
            date: dateForm
        });

        console.log('Booking of Phsyio', BookingOfPhsyio.length)


        res.status(200).json({
            success: true,
            message: 'Bookings fetched successfully',
            data: BookingOfPhsyio,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message,
        });
    }
};