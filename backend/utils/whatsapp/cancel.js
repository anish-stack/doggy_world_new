const axios = require('axios');

const CancelBookings = async (mobileNumber, content) => {
    try {
        if (!mobileNumber) {
            throw new Error('Missing mobile number');
        }


        const API_END_POINT = 'https://api.interakt.ai/v1/public/message/';

        const options = {
            method: 'POST',
            url: API_END_POINT,
            headers: {
                'Authorization': `Basic UllfVU5FMEcyYnFGd2lNb1FGV2hZZmkzOTNHT0FkaFY3NG4xamx3dEJPRTo=`,
                'Content-Type': 'application/json'
            },
            data: {
                countryCode: "+91",
                phoneNumber: mobileNumber,
                callbackData: "some text here",
                type: "Template",

                template: {
                    name: "cancel_booking",
                    languageCode: "en_US",
                    bodyValues: [
                        content?.for,
                        content?.name,
                        content?.ref,
                        content?.reason,
                        content?.date,
                        content?.type
                    ]
                },
            }
        };

        console.log("options", options)
        const response = await axios(options);
        console.log(`CakeBooking message sent successfully:`, response.data);
        return response.data;
    } catch (error) {
        // console.error('Error sending registration message:', error.response ? error.response.data : error.message);
        throw error;
    }
};


module.exports = CancelBookings;
