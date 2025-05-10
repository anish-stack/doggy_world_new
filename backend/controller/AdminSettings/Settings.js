const Settings = require("../../models/Settings/Settings.model");


exports.createSettings = async (req, res) => {
  try {
    // Check if settings already exist
    const existingSettings = await Settings.findOne();
    
    if (existingSettings) {
      return res.status(400).json({
        success: false,
        message: 'Settings already exist, use the update endpoint instead',
      });
    }

    const settings = new Settings(req.body);
    const savedSettings = await settings.save();
    
    res.status(201).json({
      success: true,
      data: savedSettings,
      message: 'Settings created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create settings',
      error: error.message,
    });
  }
};


exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings',
      error: error.message,
    });
  }
};


exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found, create settings first',
      });
    }
    
    // Update settings with new values
    Object.keys(req.body).forEach(key => {
      settings[key] = req.body[key];
    });
    
    const updatedSettings = await settings.save();
    
    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};


exports.deleteSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found',
      });
    }
    
    await settings.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Settings deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete settings',
      error: error.message,
    });
  }
};

exports.createAdminSettings = async (req, res) => {
  try {
    // Check if settings already exist
    const existingSettings = await Settings.findOne();
    
    if (existingSettings) {
      return res.status(400).json({
        success: false,
        message: 'Settings already exist, use the update endpoint instead',
      });
    }

    // Validate booking time fields
    const bookingCategories = [
      'imagingTestBookingTimes',
      'vaccinationBookingTimes',
      'labTestBookingTimes',
      'groomingBookingTimes',
      'physiotherapyBookingTimes'
    ];

    for (const category of bookingCategories) {
      if (req.body[category]) {
        // Validate time format if provided
        if (req.body[category].start && !isValidTimeFormat(req.body[category].start)) {
          return res.status(400).json({
            success: false,
            message: `Invalid time format for ${category}.start`
          });
        }
        if (req.body[category].end && !isValidTimeFormat(req.body[category].end)) {
          return res.status(400).json({
            success: false,
            message: `Invalid time format for ${category}.end`
          });
        }
        
        // Validate disabled time slots if provided
        if (req.body[category].disabledTimeSlots && Array.isArray(req.body[category].disabledTimeSlots)) {
          for (const slot of req.body[category].disabledTimeSlots) {
            if (slot.type === 'single' && !isValidTimeFormat(slot.time)) {
              return res.status(400).json({
                success: false,
                message: `Invalid time format in disabled time slot for ${category}`
              });
            }
            if (slot.type === 'range') {
              if (!isValidTimeFormat(slot.start) || !isValidTimeFormat(slot.end)) {
                return res.status(400).json({
                  success: false,
                  message: `Invalid time range format in disabled time slot for ${category}`
                });
              }
            }
          }
        }
      }
    }

    const settings = new Settings(req.body);
    const savedSettings = await settings.save();
    
    res.status(201).json({
      success: true,
      data: savedSettings,
      message: 'Admin settings created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admin settings',
      error: error.message,
    });
  }
};


function isValidTimeFormat(time) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}