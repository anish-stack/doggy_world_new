const jwt = require('jsonwebtoken');
const sendToken = (user, statusCode, res, msg) => {
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        {
            expiresIn: '30d',
        }
    );

    const options = {
        expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            message: msg,
            success: true,
            token,
            user,
        });
};

module.exports = sendToken;
