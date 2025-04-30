const Coupon = require("../../models/Coupons/Coupons");

exports.createCoupon = async (req, res) => {
    const redis = req.app.get('redis');

    try {
        const { code, discountPercentage, discountType, min_purchase, description, expirationDate, position, category } = req.body;
        console.log(req.body)

        // Validate required fields
        if (!code || !discountPercentage || !discountType || !min_purchase) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Check if coupon already exists
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ message: "Coupon code already exists." });
        }

        if (discountType === 'percentage') {

            if (discountPercentage <= 0 || discountPercentage > 100) {
                return res.status(400).json({ message: "Invalid discount percentage. Must be between 1 and 100." });
            }
        }

        // Create a new coupon
        const newCoupon = new Coupon({
            code, discountPercentage, discountType, min_purchase, description, expirationDate, position, category
        });

        const savedCoupon = await newCoupon.save();

        // Clear Redis cache for coupons
        redis.del('allCoupons');

        res.status(201).json({ success: true, message: "Coupon created successfully", coupon: savedCoupon });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

exports.getCoupons = async (req, res) => {

    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            source: "database",
            data: coupons,
        });

    } catch (error) {
        return res.status(501).json({
            success: true,
            source: "database",
            error
        });

    }
};


exports.getCouponById = async (req, res) => {
    const redis = req.app.get('redis');

    try {
        const { id } = req.params;


        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        res.status(200).json({
            success: true,
            source: "database",
            data: coupon,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


exports.updateCoupon = async (req, res) => {
    const redis = req.app.get('redis');

    try {
        const { id } = req.params;
        const { code, discountPercentage, discountType, min_purchase, description, expirationDate, position, isActive, category } = req.body;





        if (discountPercentage <= 0 || discountPercentage > 100) {
            return res.status(400).json({ message: "Invalid discount percentage. Must be between 1 and 100." });
        }

        // Update the coupon
        const updatedCoupon = await Coupon.findByIdAndUpdate(id, {
            code, discountPercentage, discountType, min_purchase, description, expirationDate, position, isActive, category
        }, { new: true });

        if (!updatedCoupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        // Clear Redis cache
        redis.del('allCoupons');

        res.status(200).json({ success: true, message: "Coupon updated successfully", coupon: updatedCoupon });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


exports.deleteCoupon = async (req, res) => {
    const redis = req.app.get('redis');

    try {
        const { id } = req.params;


        const deletedCoupon = await Coupon.findByIdAndDelete(id);
        if (!deletedCoupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }


        redis.del('allCoupons');

        res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
