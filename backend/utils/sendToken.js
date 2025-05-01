

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Create Token
const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME || '1h'
  });
};


const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_TIME || '7d'
  });
};


const sendToken = async (user, statusCode, res, message) => {
  try {
    console.log('🔐 Generating token...');
    const payload = {
      id: user._id,
      role: user.role,
      email: user.email
    };

    const token = createToken(payload);
    console.log('✅ Access Token:', token);

    const refreshTokenPayload = {
      id: user._id,
      tokenId: crypto.randomBytes(16).toString('hex')
    };

    const refreshToken = createRefreshToken(refreshTokenPayload);
    console.log('🔄 Refresh Token:', refreshToken);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date()
    });

    if (user.refreshTokens.length > 5) {
      console.log('📦 Refresh token limit exceeded. Trimming...');
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    console.log('💾 Saving user with updated refreshTokens...');
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    console.log('🍪 Setting cookies...');
    res.cookie('_usertoken', token, cookieOptions);
    res.cookie('_refreshtoken', refreshToken, cookieOptions);

    user.password = undefined;

    console.log('📤 Sending response...');
    res.status(statusCode).json({
      success: true,
      message,
      token,
      refreshToken,
      user: {
        id: user._id,
        clinicName: user.clinicName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error in sendToken:', error);
    res.status(500).json({ success: false, message: 'Token handling failed' });
  }
};

// Verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = { sendToken, verifyToken, verifyRefreshToken, createToken };