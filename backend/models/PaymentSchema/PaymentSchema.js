const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({

    petid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PetRegister',
        required: true
    },
    razorpay_order_id: {
        type: String,
        trim: true
    },
    amount: {
        type: String,
    },
    razorpay_payment_id: {
        type: String,
        trim: true
    },
    payment_status: {
        type: String,

        default: 'Pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
