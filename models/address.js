const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  locality: {
    type: String,
    minlength:4,
    maxlength:15,
    required: true,
    validate:{
      validator:function(value){
        return value.trim().length>0
      },
      message:"locality name cannot be all spaces only"
    }
  },

  city: {
    type: String,
    required: true,
    minlength:4,
    maxlength:15,
    validate:{
      validator:function (value){
        return value.trim().length>0
      },
      message:"city name cannot be all spaces"
    },

  },

  district: {
    type: String,
    required: true,
    minlength:4,
    maxlength:15,
    validate:{
      validator:function (value){
        return value.trim().length>0
      },
      message:"district name cannot be all space"
    }
  },
  state: {
    type: String,
    required: true,
    minlength:4,
    maxlength:15,
    validate:{
      validator:function (value){
        return value.trim().length>0
      },
      message:"state name cannot be all space"
    }
  },
  zipcode: {
    type: String,
    required: true,
    validate:{
      validator:function (value){
        return value.length === 6
      },
      message:'zip code must be six digit'
    }
  },
});


const Address = mongoose.model('Address', addressSchema);

module.exports = Address;