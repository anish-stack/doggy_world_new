const mongoose = require('mongoose');

const GroomingPackageSchemaJson = new mongoose.Schema({
   data:{
    type:Object
   }
});

module.exports = mongoose.model('GroomingPackageJson', GroomingPackageSchemaJson);