const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    cart:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Cart',
        required:true,
    },
    address:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Address',
        required:true,
    },
    payment:{
        type:String,
        enum:["Cash on Delivery",'Netbanking','Card Payment','Razorpay','Wallet'],
        required:true,
    },
    status:{
        type:String,
        enum:['payment_pending','shipped','delivered','cancelled','paid'],
        default:'payment_pending'
    },
    cartHistory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CartHistory',
    },
    products:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:true,
            },
            quantity:{
                type:Number,
                required:true,
            },
            status:{
                type:String,
                enum:['pending','shipped','cancelled','returned','delivered'],
                default:'pending'
            },
            size:{
                type:String,
                enum:['uk7','uk8','uk9','uk10'],
                required:true,
            },
            discountedPrice:{
                type:Number,
            
            }
        },
    ],
    razorpayOrderId: String,
    createdAt:{
        type:Date,
        default:Date.now()
    }


})


const Order  = mongoose.model('Order',orderSchema);
module.exports = Order;
