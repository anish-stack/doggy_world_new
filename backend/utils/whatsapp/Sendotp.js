const axios = require('axios');

const sendOtp = async (mobileNumber, otp) => {
    try {
        if (!mobileNumber || !otp) {
            throw new Error('Missing mobile number or OTP');
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
                "countryCode": "+91",
                "phoneNumber": mobileNumber,
                "callbackData": "otp is sending",
                "type": "Template",
                "template": {
                    "name": "otp",
                    "languageCode": "en",
                    "bodyValues": [otp],
                    "buttonValues": {
                        "0": [otp]
                    }
                }
            }
        };

        const response = await axios(options);
        console.log('OTP sent successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending OTP:', error.response ? error.response.data : error.message);
        throw error;
    }
};

module.exports = sendOtp;
