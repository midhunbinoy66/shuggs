const mongoose = require('mongoose');


const couponSchema  = new mongoose.Schema({
    code:{
        type:String,
        requied:true,
        unique:true,
    },
    discountType:{
        type:String,
        enum:['percentage','fixed'],
        requied:true,
        
    },
    discountAmount:{
        type:Number,
        required:true,
        min:[0,'discount amount cannot be a negative number']
    },
    maxDiscountAmount:{
        type:Number,
        requied:true,
        min:[0,'max discount amount cannot be less than zero']
    },
    
    expiryDate: { type: Date },
})

const Coupon = mongoose.model('Coupon',couponSchema);
module.exports= Coupon;
