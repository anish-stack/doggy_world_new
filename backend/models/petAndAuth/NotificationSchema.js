const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    fcmtoken: {
        type: String,
        unique: true,
        trim: true
    },
    fcmTokenUpdateDate: {
        type: Date
    },
    deviceId:String
});

module.exports = mongoose.model('Notification', NotificationSchema);