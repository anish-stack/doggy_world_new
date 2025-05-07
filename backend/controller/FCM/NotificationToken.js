const Notification = require("../../models/petAndAuth/NotificationSchema");

const notificationController = {
    async registerToken(req, res) {
        try {
            console.log(req.body)
            const { fcmToken, deviceId } = req.body;

            const existingNotification = await Notification.findOne({ fcmtoken:fcmToken });

            if (existingNotification) {
                existingNotification.fcmTokenUpdateDate = new Date();
                existingNotification.deviceId = deviceId;
                await existingNotification.save();
                return res.status(200).json(existingNotification);
            }

            const newNotification = new Notification({
                fcmtoken:fcmToken,
                fcmTokenUpdateDate: new Date(),
                deviceId
            });

            await newNotification.save();
            return res.status(201).json(newNotification);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    async getAllTokens(req, res) {
        try {
            const notifications = await Notification.find({});
            return res.status(200).json(notifications);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    async getTokenById(req, res) {
        try {
            const notification = await Notification.findById(req.params.id);
            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            return res.status(200).json(notification);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    async deleteToken(req, res) {
        try {
            const notification = await Notification.findByIdAndDelete(req.params.id);
            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            return res.status(200).json({ message: 'Notification deleted successfully' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    async updateToken(req, res) {
        try {
            const updates = req.body;
            updates.fcmTokenUpdateDate = new Date();

            const notification = await Notification.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }

            return res.status(200).json(notification);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    async findByToken(req, res) {
        try {
            const { fcmtoken } = req.params;
            const notification = await Notification.findOne({ fcmtoken });

            if (!notification) {
                return res.status(404).json({ message: 'Token not found' });
            }

            return res.status(200).json(notification);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
};

module.exports = notificationController;