
const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayUtils {
  constructor(keyId, keySecret, testMode = false) {
    if (!keyId || !keySecret) {
      throw new Error('Razorpay key_id and key_secret are required');
    }

    this.instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    this.testMode = testMode;
    this.webhookSecret = null;
  }

  setWebhookSecret(secret) {
    this.webhookSecret = secret;
  }

  async createPayment(options) {
    try {
      const defaultOptions = {
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1,
      };

      const orderOptions = { ...defaultOptions, ...options };
      
      if (!orderOptions.amount) {
        throw new Error('Amount is required for creating payment');
      }

      // Amount should be in paise (multiply by 100 if in rupees)
      if (orderOptions.amount < 100 && !this.testMode) {
        orderOptions.amount *= 100;
      }

      const order = await this.instance.orders.create(orderOptions);
      
      return {
        success: true,
        order,
        key: this.instance.key_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create payment',
      };
    }
  }

  async verifyPayment(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error('Missing required payment verification parameters');
      }

      // Creating a signature for verification
      const hmac = crypto.createHmac('sha256', this.instance.key_secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');
      
      // Comparing signatures
      const isValid = generatedSignature === razorpay_signature;
      
      if (isValid) {
        // Fetch payment details from Razorpay
        const payment = await this.instance.payments.fetch(razorpay_payment_id);
        
        return {
          success: true,
          verified: true,
          payment,
        };
      } else {
        return {
          success: false,
          verified: false,
          error: 'Payment signature verification failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        verified: false,
        error: error.message || 'Payment verification failed',
      };
    }
  }

  async verifyWebhook(payload, signature) {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret is not set');
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  async getPayment(paymentId) {
    try {
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }

      const payment = await this.instance.payments.fetch(paymentId);
      
      return {
        success: true,
        payment,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch payment',
      };
    }
  }

  async refundPayment(paymentId, options = {}) {
    try {
      if (!paymentId) {
        throw new Error('Payment ID is required for refund');
      }

      const refundOptions = {
        ...options,
        payment_id: paymentId,
      };

      const refund = await this.instance.payments.refund(refundOptions);
      
      return {
        success: true,
        refund,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to process refund',
      };
    }
  }

  async getAllPayments(options = {}) {
    try {
      const payments = await this.instance.payments.all(options);
      
      return {
        success: true,
        payments,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch payments',
      };
    }
  }
}

module.exports = RazorpayUtils;