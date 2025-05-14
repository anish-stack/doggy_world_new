const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
});


const templateCache = {};


const getCompiledTemplate = (templateName) => {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }
  
  try {
    // Path to email templates
    const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    
    // Cache the compiled template
    templateCache[templateName] = template;
    return template;
  } catch (error) {
    console.error(`Error loading email template ${templateName}:`, error);
    
    // Return a simple fallback template function if the template isn't found
    return (data) => `
      <h1>Order Confirmation: ${data.orderNumber}</h1>
      <p>Thank you for your order!</p>
      <p>We'll be in touch soon with more details.</p>
      <p>Order Total: $${data.total || 'N/A'}</p>
      <p>For any questions, please contact us at ${data.supportEmail || config.supportEmail}</p>
    `;
  }
};


const generatePlainTextFromHtml = (html) => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
};


const sendEmail = async (emailData) => {
  try {
 
    if (!emailData.to) {
      throw new Error('Recipient email (to) is required');
    }
    
    if (!emailData.subject) {
      throw new Error('Email subject is required');
    }
    
    let html = emailData.html || '';
    let text = emailData.text || '';
    
    // If using a template, compile it with the provided data
    if (emailData.template) {
      const template = getCompiledTemplate(emailData.template);
      html = template(emailData.data || {});
      
      // Generate plain text version from HTML if not provided
      if (!text) {
        text = generatePlainTextFromHtml(html);
      }
    }
    
    // Setup email options
    const mailOptions = {
      from: emailData.from || '"Pet Store" <noreply@petstore.com>',
      to: emailData.to,
      subject: emailData.subject,
      html: html,
      text: text || generatePlainTextFromHtml(html)
    };
    
    // Add CC if provided
    if (emailData.cc) {
      mailOptions.cc = emailData.cc;
    }
    
    // Add BCC if provided
    if (emailData.bcc) {
      mailOptions.bcc = emailData.bcc;
    }
    
    // Add attachments if provided
    if (emailData.attachments && Array.isArray(emailData.attachments)) {
      mailOptions.attachments = emailData.attachments;
    }
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    // For development/debugging - log the email attempt
    console.log('Failed email data:', {
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template
    });
    
    throw error;
  }
};

// Register Handlebars helpers
handlebars.registerHelper('formatCurrency', function(value) {
  if (!value && value !== 0) return 'N/A';
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value);
});

handlebars.registerHelper('formatDate', function(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

module.exports = { sendEmail };