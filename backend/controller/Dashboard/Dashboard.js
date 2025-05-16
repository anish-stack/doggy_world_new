const CakeBooking = require("../../models/Cake Models/CakeBooking");
const sendNotification = require("../../utils/sendNotification");
const mongoose = require('mongoose');
const BakeryAndShopBooking = require("../../models/commonBooking/BakeryAndShopBooking");
const BookingConsultations = require("../../models/Consultations/BookingConsultations");
const LabTestBooking = require("../../models/LabsTest/LabBooking");
const VaccinationBooking = require("../../models/VaccinationSchema/VaccinationBooking");
const BookingPhysioModel = require("../../models/PhysioTherapy/BookingPhysio.model");
const dayjs = require('dayjs');
const petShopProduct = require("../../models/PetShops/petShopProduct");
const petBakeryProduct = require("../../models/Bakery/petBakeryProduct");
const _ = require('lodash'); // Added lodash for data manipulation

exports.DashboardAggregationDataThroughJS = async (req, res) => {
    try {
        // Get Redis client
        const redis = req.app.get('redis');
        const CACHE_TTL = 3600; // Cache for 1 hour
        const CACHE_KEY = 'admin_dashboard_data';

        // Try to get data from Redis cache first
        const cachedData = await redis.get(CACHE_KEY);
        if (cachedData) {
            console.log("Serving dashboard data from cache");
            return res.status(200).json(JSON.parse(cachedData));
        }

        // If no cache, gather all dashboard data
        console.log("Generating fresh dashboard data");

        // Basic counts
        const [
            CakeBookingCount,
            BakeryAndShopCount,
            ConsultationsCount,
            LabTestCount,
            VaccinationCount,
            BookingPhysioCount,
            ShopProductCount,
            petBakeryCount
        ] = await Promise.all([
            CakeBooking.countDocuments(),
            BakeryAndShopBooking.countDocuments(),
            BookingConsultations.countDocuments(),
            LabTestBooking.countDocuments(),
            VaccinationBooking.countDocuments(),
            BookingPhysioModel.countDocuments(),
            petShopProduct.countDocuments(),
            petBakeryProduct.countDocuments()
        ]);

        // Get today and tomorrow for new orders filtering
        const today = dayjs().startOf('day');
        const tomorrow = dayjs().add(1, 'day').endOf('day');

        // New Orders (from today and tomorrow)
        const [
            newCakeBookings,
            newBakeryAndShopBookings,
            newConsultations,
            newLabTests,
            newVaccinations,
            newPhysioBookings
        ] = await Promise.all([
            // 🎂 Cake Bookings
            CakeBooking.find({
                createdAt: { $gte: today.toDate(), $lte: tomorrow.toDate() },
                bookingStatus: 'Confirmed'
            }).select('_id bookingDate totalAmount').limit(10),

            // 🛍️ Bakery & Shop Orders
            BakeryAndShopBooking.find({
                createdAt: { $gte: today.toDate(), $lte: tomorrow.toDate() },
                status: 'Confirmed'
            }).select('_id orderDate totalAmount').limit(10),

            // 🩺 Consultations
            BookingConsultations.find({
                createdAt: { $gte: today.toDate(), $lte: tomorrow.toDate() },
                status: 'Confirmed'
            }).select('_id consultationDate').populate('paymentDetails', 'amount').limit(10),

            // 🧪 Lab Tests
            LabTestBooking.find({
                createdAt: { $gte: today.toDate(), $lte: tomorrow.toDate() },
                status: 'Confirmed'
            }).select('_id testDate').populate('payment', 'amount').limit(10),

            // 💉 Vaccinations
            VaccinationBooking.find({
                createdAt: { $gte: today.toDate(), $lte: tomorrow.toDate() },
                status: 'Confirmed'
            }).select('_id vaccinationDate').populate('payment', 'amount').limit(10),

            // 🧘 Physio Bookings
            BookingPhysioModel.find({
                createdAt: { $gte: today.toDate(), $lte: tomorrow.toDate() },
                status: 'Confirmed'
            }).select('_id appointmentDate').populate('paymentDetails', 'amount').limit(10)
        ]);

        // ✅ Debug logs
        // console.log("✅ Confirmed Cake Bookings:", newCakeBookings.length);
        // console.log("✅ Confirmed Bakery/Shop Orders:", newBakeryAndShopBookings.length);
        // console.log("✅ Confirmed Consultations:", newConsultations.length);
        // console.log("✅ Confirmed Lab Tests:", newLabTests.length);
        // console.log("✅ Confirmed Vaccinations:", newVaccinations.length);
        // console.log("✅ Confirmed Physio Bookings:", newPhysioBookings.length);

        // Total Revenue calculations using JS instead of aggregation

        // 1. Get all the data first
        const [
            cakeBookings,
            bakeryAndShopBookings,
            consultationBookings,
            labTestBookings,
            vaccinationBookings,
            physioBookings
        ] = await Promise.all([
            // Get all delivered cake bookings
            CakeBooking.find({ bookingStatus: 'Delivered' }).select('totalAmount'),

            // Get all delivered bakery and shop bookings
            BakeryAndShopBooking.find({ status: 'Delivered' }).select('totalAmount'),

            // Get all completed consultations with payment details
            BookingConsultations.find({ status: 'Completed' })
                .populate('paymentDetails', 'amount'),

            // Get all completed lab tests with payment details  
            LabTestBooking.find({ status: 'Completed' })
                .populate('payment', 'amount'),

            // Get all completed vaccinations with payment details
            VaccinationBooking.find({ status: 'Completed' })
                .populate('payment', 'amount'),

            // Get all completed physio bookings with payment details
            BookingPhysioModel.find({ status: 'Completed' })
                .populate('paymentDetails', 'amount')
        ]);

        // 2. Calculate revenue using JS reduce method instead of MongoDB aggregation
        const cakeRevenue = cakeBookings.reduce((sum, booking) =>
            sum + (booking.totalAmount || 0), 0);

        const bakeryAndShopRevenue = bakeryAndShopBookings.reduce((sum, booking) =>
            sum + (booking.totalAmount || 0), 0);

        const consultationRevenue = consultationBookings.reduce((sum, booking) => {
            const amount = booking.paymentDetails && booking.paymentDetails.amount
                ? booking.paymentDetails.amount / 100 // Dividing by 100 as shown in original code
                : 0;
            return sum + amount;
        }, 0);

        const labTestRevenue = labTestBookings.reduce((sum, booking) => {
            const amount = booking.payment && booking.payment.amount
                ? booking.payment.amount / 100
                : 0;
            return sum + amount;
        }, 0);

        const vaccinationRevenue = vaccinationBookings.reduce((sum, booking) => {
            const amount = booking.payment && booking.payment.amount
                ? booking.payment.amount / 100
                : 0;
            return sum + amount;
        }, 0);

        const physioRevenue = physioBookings.reduce((sum, booking) => {
            const amount = booking.paymentDetails && booking.paymentDetails.amount
                ? booking.paymentDetails.amount / 100
                : 0;
            return sum + amount;
        }, 0);

        // Get revenue by time periods (current month, next 3 months, next 6 months)
        const currentMonth = dayjs().startOf('month');
        const nextMonth = dayjs().add(1, 'month').endOf('month');
        const next3Months = dayjs().add(3, 'months').endOf('month');
        const next6Months = dayjs().add(6, 'months').endOf('month');

        // Calculate revenue projections for different time periods
        // const [
        //     revenueTillNextMonth,
        //     revenueTillNext3Months,
        //     revenueTillNext6Months
        // ] = await Promise.all([
        //     // Revenue till next month end
        //     calculateRevenueProjectionJS(currentMonth.toDate(), nextMonth.toDate()),

        //     // Revenue till next 3 months end
        //     calculateRevenueProjectionJS(currentMonth.toDate(), next3Months.toDate()),

        //     // Revenue till next 6 months end
        //     calculateRevenueProjectionJS(currentMonth.toDate(), next6Months.toDate())
        // ]);

        // Recent Orders (5 of each type)
        const [
            recentBakeryOrders,
            recentConsultations,
            recentVaccinations,
            recentPhysioBookings,
            recentLabTests
        ] = await Promise.all([
            BakeryAndShopBooking.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id orderDate totalAmount status customerName'),

            BookingConsultations.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id consultationDate status patientName')
                .populate('paymentDetails', 'amount'),

            VaccinationBooking.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id vaccinationDate status petName')
                .populate('payment', 'amount'),

            BookingPhysioModel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id appointmentDate status patientName')
                .populate('paymentDetails', 'amount'),

            LabTestBooking.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id testDate status patientName')
                .populate('payment', 'amount')
        ]);

        // Low stock products (less than 5 in stock) - Using JS instead of MongoDB aggregation
        const allShopProducts = await petShopProduct.find().lean();
        const allBakeryProducts = await petBakeryProduct.find().lean();

        // Process shop products with low stock using JavaScript
        const lowStockShopProducts = allShopProducts
            .filter(product => {
                // Check if main stock is low
                const isMainStockLow = product.stock !== undefined && product.stock < 5 && product.stock >= 0;

                // Check if any variant has low stock
                const hasLowVariantStock = product.variants &&
                    product.variants.some(v => v.stock !== undefined && v.stock < 5 && v.stock >= 0);

                return isMainStockLow || hasLowVariantStock;
            })
            .map(product => {
                // Create a new object with filtered variants
                const lowStockVariants = product.variants && product.variants.filter(
                    v => v.stock !== undefined && v.stock < 5 && v.stock >= 0
                );

                return {
                    _id: product._id,
                    name: product.name,
                    mainStock: product.stock,
                    variants: lowStockVariants || []
                };
            });

        // Process bakery products with low stock using JavaScript
        const lowStockBakeryProducts = allBakeryProducts
            .filter(product => {
                // Check if main stock is low
                const isMainStockLow = product.stock !== undefined && product.stock < 5 && product.stock >= 0;

                // Check if any variant has low stock
                const hasLowVariantStock = product.variants &&
                    product.variants.some(v => v.stock !== undefined && v.stock < 5 && v.stock >= 0);

                return isMainStockLow || hasLowVariantStock;
            })
            .map(product => {
                // Create a new object with filtered variants
                const lowStockVariants = product.variants && product.variants.filter(
                    v => v.stock !== undefined && v.stock < 5 && v.stock >= 0
                );

                return {
                    _id: product._id,
                    name: product.name,
                    mainStock: product.stock,
                    variants: lowStockVariants || []
                };
            });

        // Sales analytics by category for dashboard charts - Using JS/lodash instead of MongoDB aggregation
        const deliveredBakeryOrders = await BakeryAndShopBooking.find({
            status: { $in: ['Delivered', 'Completed'] }
        }).lean();

        // Group orders by category and sum the total amounts using lodash
        const salesByCategory = _(deliveredBakeryOrders)
            .groupBy('productCategory')
            .map((orders, category) => ({
                _id: category,
                totalSales: _.sumBy(orders, 'totalAmount')
            }))
            .orderBy(['totalSales'], ['desc'])
            .value();

        // Compile all data for dashboard
        const dashboardData = {
            counts: {
                cakeBookings: CakeBookingCount,
                bakeryAndShopBookings: BakeryAndShopCount,
                consultations: ConsultationsCount,
                labTests: LabTestCount,
                vaccinations: VaccinationCount,
                physioBookings: BookingPhysioCount,
                shopProducts: ShopProductCount,
                bakeryProducts: petBakeryCount
            },
            newOrders: {
                cakeBookings: newCakeBookings,
                bakeryAndShopBookings: newBakeryAndShopBookings,
                consultations: newConsultations,
                labTests: newLabTests,
                vaccinations: newVaccinations,
                physioBookings: newPhysioBookings
            },
            revenueData: {
                cakeRevenue: cakeRevenue.toFixed(2),
                bakeryAndShopRevenue: bakeryAndShopRevenue.toFixed(2),
                consultationRevenue: consultationRevenue.toFixed(2),
                labTestRevenue: labTestRevenue.toFixed(2),
                vaccinationRevenue: vaccinationRevenue.toFixed(2),
                physioRevenue: physioRevenue.toFixed(2)
            },
            // revenueProjections: {
            //     tillNextMonth: revenueTillNextMonth,
            //     tillNext3Months: revenueTillNext3Months,
            //     tillNext6Months: revenueTillNext6Months
            // },
            recentOrders: {
                bakeryOrders: recentBakeryOrders,
                consultations: recentConsultations,
                vaccinations: recentVaccinations,
                physioBookings: recentPhysioBookings,
                labTests: recentLabTests
            },
            lowStock: {
                shopProducts: lowStockShopProducts,
                bakeryProducts: lowStockBakeryProducts
            },
            analytics: {
                salesByCategory: salesByCategory
            }
        };

        // Calculate total revenue across all services
        const totalRevenue =
            cakeRevenue +
            bakeryAndShopRevenue +
            consultationRevenue +
            labTestRevenue +
            vaccinationRevenue +
            physioRevenue;

        dashboardData.totalRevenue = totalRevenue;

        // Store in Redis cache
        await redis.set(CACHE_KEY, JSON.stringify(dashboardData), 'EX', CACHE_TTL);

        // Send notification if there are low stock products that need attention
        if (lowStockShopProducts.length + lowStockBakeryProducts.length > 0) {
            await sendNotification({
                title: "Low Stock Alert",
                message: `${lowStockShopProducts.length + lowStockBakeryProducts.length} products need inventory replenishment.`,
                type: "inventory",
                priority: "high"
            });
        }

        return res.status(200).json(dashboardData);

    } catch (error) {
        console.error("Dashboard aggregation error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard data",
            error: error.message
        });
    }
};

// Helper function to calculate revenue projections using JavaScript instead of MongoDB aggregation
async function calculateRevenueProjectionJS(startDate, endDate) {
    try {
        // Fetch all relevant data for the given date range
        const [
            cakeBookings,
            bakeryAndShopBookings,
            consultationBookings,
            labTestBookings,
            vaccinationBookings,
            physioBookings
        ] = await Promise.all([
            // Cake Bookings for projection
            CakeBooking.find({
                bookingDate: { $gte: startDate, $lte: endDate },
                bookingStatus: { $nin: ['Cancelled', 'Rejected'] }
            }).select('totalAmount').lean(),

            // Bakery and Shop for projection
            BakeryAndShopBooking.find({
                orderDate: { $gte: startDate, $lte: endDate },
                status: { $nin: ['Cancelled', 'Rejected'] }
            }).select('totalAmount').lean(),

            // Consultations for projection
            BookingConsultations.find({
                consultationDate: { $gte: startDate, $lte: endDate },
                status: { $nin: ['Cancelled', 'Rejected'] }
            }).populate('paymentDetails', 'amount').lean(),

            // Lab Tests for projection
            LabTestBooking.find({
                testDate: { $gte: startDate, $lte: endDate },
                status: { $nin: ['Cancelled', 'Rejected'] }
            }).populate('payment', 'amount').lean(),

            // Vaccinations for projection
            VaccinationBooking.find({
                vaccinationDate: { $gte: startDate, $lte: endDate },
                status: { $nin: ['Cancelled', 'Rejected'] }
            }).populate('payment', 'amount').lean(),

            // Physio appointments for projection
            BookingPhysioModel.find({
                appointmentDate: { $gte: startDate, $lte: endDate },
                status: { $nin: ['Cancelled', 'Rejected'] }
            }).populate('paymentDetails', 'amount').lean()
        ]);

        // Calculate revenue for each service using JavaScript reduce method
        const cakeRevenue = cakeBookings.reduce(
            (total, booking) => total + (booking.totalAmount || 0), 0
        );

        const bakeryAndShopRevenue = bakeryAndShopBookings.reduce(
            (total, booking) => total + (booking.totalAmount || 0), 0
        );

        const consultationRevenue = consultationBookings.reduce((total, booking) => {
            const amount = booking.paymentDetails && booking.paymentDetails.amount
                ? booking.paymentDetails.amount / 100
                : 0;
            return total + amount;
        }, 0);

        const labTestRevenue = labTestBookings.reduce((total, booking) => {
            const amount = booking.payment && booking.payment.amount
                ? booking.payment.amount / 100
                : 0;
            return total + amount;
        }, 0);

        const vaccinationRevenue = vaccinationBookings.reduce((total, booking) => {
            const amount = booking.payment && booking.payment.amount
                ? booking.payment.amount / 100
                : 0;
            return total + amount;
        }, 0);

        const physioRevenue = physioBookings.reduce((total, booking) => {
            const amount = booking.paymentDetails && booking.paymentDetails.amount
                ? booking.paymentDetails.amount / 100
                : 0;
            return total + amount;
        }, 0);

        // Calculate total revenue
        const totalRevenue =
            cakeRevenue +
            bakeryAndShopRevenue +
            consultationRevenue +
            labTestRevenue +
            vaccinationRevenue +
            physioRevenue;

        return {
            cake: cakeRevenue,
            bakeryAndShop: bakeryAndShopRevenue,
            consultation: consultationRevenue,
            labTest: labTestRevenue,
            vaccination: vaccinationRevenue,
            physio: physioRevenue,
            total: totalRevenue
        };
    } catch (error) {
        console.error("Error calculating revenue projection:", error);
        throw error;
    }
}

// Additional utility endpoint to refresh the dashboard cache
exports.refreshDashboardCache = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const CACHE_KEY = 'admin_dashboard_data';

        // Delete the existing cache
        await redis.del(CACHE_KEY);

        return res.status(200).json({
            success: true,
            message: "Dashboard cache cleared successfully. Next request will generate fresh data."
        });
    } catch (error) {
        console.error("Error refreshing dashboard cache:", error);
        return res.status(500).json({
            success: false,
            message: "Error refreshing dashboard cache",
            error: error.message
        });
    }
};