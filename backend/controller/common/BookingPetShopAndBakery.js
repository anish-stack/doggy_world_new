const BakeryAndShopBooking = require("../../models/commonBooking/BakeryAndShopBooking");
const petShopProduct = require("../../models/PetShops/petShopProduct");
const petBakeryProduct = require("../../models/Bakery/petBakeryProduct");

const AppError = require("../../utils/ApiError");
const dayjs = require('dayjs');
const Address = require("../../models/AddressModel/AddressModel");
const RazorpayUtils = require("../../utils/razorpayUtils");
const PaymentSchema = require("../../models/PaymentSchema/PaymentSchema");
const sendNotification = require("../../utils/sendNotification");
const razorpayUtils = new RazorpayUtils(
    process.env.RAZORPAY_KEY_ID,
    process.env.RAZORPAY_KEY_SECRET
);

exports.makeBookingForPetBakeryAndShop = async (req, res) => {
    try {
        const petId = req.user.id; // Get petId from authenticated user
        const data = req.body;

        console.log("Pet ID:", req.user);
        console.log("Booking Request Body:", data);

        // 1. Validate items and fetch product details
        const itemsWithDetails = [];
        let subtotal = 0;


        for (const item of data.items) {
            // Determine which model to use based on product type
            const productModel = item.isPetShopProduct ? petShopProduct : petBakeryProduct;
            const itemModel = item.isPetShopProduct ? 'PetShopProduct' : 'petBakeryProduct';

            // Fetch product details from database
            const product = await productModel.findById(item.ProductId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${item.ProductId} not found`
                });
            }

            // Calculate item pricing
            let unitPrice = 0;
            let variantDetails = null;

            if (item.isVarientTrue) {
                // Handle variant products
                const variant = product.variants.id(item.varientId);
                if (!variant) {
                    return res.status(404).json({
                        success: false,
                        message: `Variant with ID ${item.varientId} not found for product ${item.ProductId}`
                    });
                }
                unitPrice = variant.price;
                variantDetails = {
                    hasVariant: true,
                    variantId: variant._id,
                    variantModel: `${itemModel}.variants`,
                    variantName: item.varientSize
                };
            } else {
                // Handle non-variant products
                unitPrice = product.price;
                variantDetails = {
                    hasVariant: false
                };
            }

            const itemSubtotal = unitPrice * item.quantity;
            subtotal += itemSubtotal;

            // Create formatted item for database
            itemsWithDetails.push({
                ...variantDetails,
                itemId: product._id,
                itemModel: itemModel,
                quantity: item.quantity,
                unitPrice: unitPrice,
                subtotal: itemSubtotal
            });
        }

        // 2. Validate delivery address
        const deliveryAddress = await Address.findById(data.addressId);
        if (!deliveryAddress) {
            return res.status(404).json({
                success: false,
                message: "Delivery address not found"
            });
        }

        // 3. Calculate tax, shipping, and total amount
        const taxAmount = data.paymentDetails.tax;
        const shippingFee = data.paymentDetails.deliveryFee;
        const discountAmount = data.paymentDetails.discount || 0;
        const totalAmount = data.cartTotal;

        // 4. Set delivery date (e.g., 3 days from now)
        const deliveryDate = dayjs().add(3, 'day').toDate();

        // 5. Create booking object
        const bookingData = {
            petId: petId,
            items: itemsWithDetails,
            deliveryInfo: data.addressId,
            deliveryDate: deliveryDate,
            subtotal: subtotal,
            taxAmount: taxAmount,
            shippingFee: shippingFee,
            discountAmount: discountAmount,
            totalAmount: totalAmount,
            paymentMethod: data.paymentMethod,
            couponApplied: !!data.couponCode,
            fcmToken: data.fcm,
            couponCode: data.couponCode || undefined,
            status: 'Pending'
        };

        // Create status history entry
        bookingData.statusHistory = [{
            status: 'Pending',
            timestamp: new Date(),
            note: 'Order placed'
        }];

        // 6. Handle payment processing based on method
        let response;

        if (data.paymentMethod.toLowerCase() === 'online') {
            // Create Razorpay order for online payment
            const orderOptions = {
                amount: Math.round(totalAmount * 100), // Razorpay expects amount in smallest currency unit (paise)
                currency: "INR",
                receipt: `order_rcpt_${Date.now()}`,
                payment_capture: 1
            };

            const razorpayOrder = await razorpayUtils.createPayment(orderOptions);
            const saveInPayment = await PaymentSchema.create({
                forWhat: 'petShopOrPetBakery',
                petid: petId,
                razorpay_order_id: razorpayOrder?.order?.id,
                amount: razorpayOrder?.order?.amount,
                status: razorpayOrder?.order?.status
            });

            // Create booking with Razorpay order details
            const booking = new BakeryAndShopBooking({
                ...bookingData,
                paymentDetails: saveInPayment._id,
                paymentStatus: 'Pending'
            });


            await booking.save();

            response = {
                success: true,
                message: "Booking created successfully, awaiting payment",
                data: {
                    bookingId: booking._id,
                    orderNumber: booking.orderNumber,
                    razorpayOrderId: razorpayOrder.order.id,
                    razorpayKey: process.env.RAZORPAY_KEY_ID,
                    amount: orderOptions.amount,
                    currency: orderOptions.currency
                },
                user: req.user ? req.user : {}
            };
        } else if (data.paymentMethod.toLowerCase() === 'cash on delivery' || data.paymentMethod.toLowerCase() === 'cod') {
            // Create booking with COD payment method
            const booking = new BakeryAndShopBooking({
                ...bookingData,
                paymentStatus: 'Pending',
                paymentMethod: 'Cash on Delivery'
            });

            await booking.save();

            response = {
                success: true,
                message: "Cash on Delivery booking created successfully",
                data: {
                    bookingId: booking._id,
                    orderNumber: booking.orderNumber,
                    totalAmount: totalAmount
                }
            };
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        return res.status(200).json(response);

    } catch (error) {
        console.error("Booking Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while making booking",
            error: error.message
        });
    }
};



exports.getBookingDetailsShopBooking = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)

        const findOrder = await BakeryAndShopBooking.findById(id)
            .populate('paymentDetails')
            .populate('items.itemId')
            .populate('petId')
            .populate('deliveryInfo');

        if (!findOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, data: findOrder });
    } catch (error) {
        console.error("Error fetching booking details:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};



exports.getAllBookingDetailsShopBooking = async (req, res) => {
    try {

        const findOrder = await BakeryAndShopBooking.find()
            .populate('petId', 'petname petOwnertNumber petbreed')
            .populate('deliveryInfo', 'street city state zipCode country')
            .populate('paymentDetails', 'razorpay_order_id amount payment_status createdAt razorpay_payment_id')
            .populate('items.itemId').sort({ createdAt: 1 })

        if (!findOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, data: findOrder });
    } catch (error) {
        console.error("Error fetching booking details:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


exports.changeOrderStatusOrBakery = async (req, res) => {
  try {
    const { id, status } = req.body;

    // Validate required fields
    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and status are required"
      });
    }
    
    // Define valid status values
    const validStatus = [
      'Pending', 
      'Confirmed', 
      'Order Placed', 
      'Packed', 
      'Dispatched', 
      'Out for Delivery', 
      'Delivered', 
      'Cancelled', 
      'Returned'
    ];
    
    // Validate status
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Status must be one of: ${validStatus.join(', ')}`
      });
    }
    
    // Find order details with populated fields
    const foundOrderDetails = await BakeryAndShopBooking.findById(id)
      .populate('petId', 'petname petOwnertNumber petbreed')
      .populate('deliveryInfo', 'street city state zipCode country')
      .populate('paymentDetails', 'razorpay_order_id amount payment_status createdAt razorpay_payment_id')
      .populate('items.itemId')
      .sort({ createdAt: 1 });
    
    // Check if order exists
    if (!foundOrderDetails) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    // Update order status
    foundOrderDetails.status = status;
    
    // Handle different status updates
    switch (status) {
      case 'Pending':
        // Just update status
        if (foundOrderDetails.fcmToken) {
          const title = 'Order Status Update';
          const body = 'Your order is now pending. We will process it shortly.';
          await sendNotification(foundOrderDetails.fcmToken, title, body);
        }
        break;
        
      case 'Confirmed':
        // Update status and send notification
        if (foundOrderDetails.fcmToken) {
          const title = 'Order Confirmed';
          const body = 'Your order has been confirmed. Thank you for your purchase!';
          await sendNotification(foundOrderDetails.fcmToken, title, body);
        }
        break;
        
      case 'Order Placed':
        // Update inventory for each item in the order
        if (foundOrderDetails.items && foundOrderDetails.items.length > 0) {
          for (let index = 0; index < foundOrderDetails.items.length; index++) {
            const element = foundOrderDetails.items[index];
            if (!element.itemId) continue; // Skip if item doesn't exist
            
            const hasVariantOrder = element.hasVariant ? true : false;
            
            if (hasVariantOrder) {
              // Handle variant inventory update
              const foundVariant = element.itemId.variants.find(i => 
                i._id.toString() === element.variantId.toString()
              );
              
              if (foundVariant) {
                foundVariant.stock -= element.quantity;
                // Ensure stock doesn't go negative
                if (foundVariant.stock < 0) foundVariant.stock = 0;
                await element.itemId.save();
              }
            } else {
              // Handle regular item inventory update
              element.itemId.stock -= element.quantity;
              // Ensure stock doesn't go negative
              if (element.itemId.stock < 0) element.itemId.stock = 0;
              await element.itemId.save();
            }
          }
        }
        
        // Send notification
        if (foundOrderDetails.fcmToken) {
          const title = 'Order Successfully Placed';
          const body = 'Your order has been successfully placed and is being processed.';
          await sendNotification(foundOrderDetails.fcmToken, title, body);
        }
        break;
        
      case 'Packed':
        // Update status and send notification
        if (foundOrderDetails.fcmToken) {
          const title = 'Order Packed';
          const body = 'Your order has been packed and will be dispatched soon.';
          await sendNotification(foundOrderDetails.fcmToken, title, body);
        }
        break;
        
      case 'Dispatched':
        // Update status and send notification
        if (foundOrderDetails.fcmToken) {
          const title = 'Order Dispatched';
          const body = 'Your order has been dispatched and is on its way.';
          await sendNotification(foundOrderDetails.fcmToken, title, body);
        }
        break;
        
      case 'Out for Delivery':
        // Update status and send notification
        if (foundOrderDetails.fcmToken) {
          const title = 'Out for Delivery';
          const body = 'Your order is out for delivery and will reach you soon.';
          await sendNotification(foundOrderDetails.fcmToken, title, body);
        }
        break;
        
      case 'Delivered':
        // Update status and send notification
        foundOrderDetails.deliveredAt = new Date();
        if (foundOrderDetails.fcmToken) {
          const title = 'Order Delivered';
          const body = 'Your order has been delivered successfully. Thank you for shopping with us!';
          await sendNotification(foundOrderDetails.fcmToken, title, body);
        }
        break;
        
      case 'Cancelled':
        // Update status and restore inventory
        if (foundOrderDetails.items && foundOrderDetails.items.length > 0) {
          for (let index = 0; index < foundOrderDetails.items.length; index++) {
            const element = foundOrderDetails.items[index];
            if (!element.itemId) continue; // Skip if item doesn't exist
            
            const hasVariantOrder = element.hasVariant ? true : false;
            
            if (hasVariantOrder) {
              // Handle variant inventory restore
              const foundVariant = element.itemId.variants.find(i => 
                i._id.toString() === element.variantId.toString()
              );
              
              if (foundVariant) {
                foundVariant.stock += element.quantity;
                await element.itemId.save();
              }
            } else {
              // Handle regular item inventory restore
              element.itemId.stock += element.quantity;
              await element.itemId.save();
            }
          }
        }
        
        // Send notification
        if (foundOrderDetails.fcmToken) {
          const title = 'Order Cancelled';
          const body = 'Your order has been cancelled. Please contact support if you need assistance.';
          await sendNotification(foundOrderDetails.fcmToken, title, body);
        }
        break;
        
      case 'Returned':
        // Update status and restore inventory
        if (foundOrderDetails.items && foundOrderDetails.items.length > 0) {
          for (let index = 0; index < foundOrderDetails.items.length; index++) {
            const element = foundOrderDetails.items[index];
            if (!element.itemId) continue; // Skip if item doesn't exist
            
            const hasVariantOrder = element.hasVariant ? true : false;
            
            if (hasVariantOrder) {
              // Handle variant inventory restore
              const foundVariant = element.itemId.variants.find(i => 
                i._id.toString() === element.variantId.toString()
              );
              
              if (foundVariant) {
                foundVariant.stock += element.quantity;
                await element.itemId.save();
              }
            } else {
              // Handle regular item inventory restore
              element.itemId.stock += element.quantity;
              await element.itemId.save();
            }
          }
        }
        
        // Send notification
        if (foundOrderDetails.fcmToken) {
          const title = 'Order Returned';
          const body = 'Your order return has been processed. Refund will be initiated shortly.';
          await sendNotification(foundOrderDetails.fcmToken, title, body);
        }
        break;
        
      default:
        // This shouldn't happen due to validation, but just in case
        return res.status(400).json({
          success: false,
          message: "Invalid status provided"
        });
    }
    
    // Save order with updated status
    await foundOrderDetails.save();
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status} successfully`,
      data: foundOrderDetails
    });
    
  } catch (error) {
    console.error("Error in changeOrderStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message
    });
  }
};


exports.deletePetShopAndBakeryOrder = async(req,res)=>{
  try {
    
  } catch (error) {
    
  }
}