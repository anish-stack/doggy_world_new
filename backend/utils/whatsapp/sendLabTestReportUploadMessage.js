
const axios = require('axios');

const LabTestMessageReport = async (mobileNumber, content, file) => {
   
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
                    name: "lab_report_upload",
                    languageCode: "en_US",
                    headerValues: [
                        file
                    ],
                    fileName: `${content?.name}-lab-test.pdf`,
                    bodyValues: [
                        content?.name,
                        content?.name
                    ]
                },
            }
        };


        const response = await axios(options);
        console.log(`Lab Test Report message sent successfully:`, response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending registration message:', error.response ? error.response.data : error.message);
        throw error;
    }
};


module.exports = LabTestMessageReport;
