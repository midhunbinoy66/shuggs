const mongoose = require('mongoose');


const cartHistorySchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    items:[{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required:true,
        },
        quantity:{
            type:Number,
            required:true,
        },
        size:{
            type:String,
            required:true,
        },
        created_at:{
            type:Date,
            default:Date.now
        }
    }]
})


const CartHistory = mongoose.model('CartHistory',cartHistorySchema);

module.exports = CartHistory;
