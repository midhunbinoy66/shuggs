const mongoose = require('mongoose');

const ProductOfferSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:['fixed','percentage'],
        required:true,
    },
    value:{
        type:Number,
        required:true
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true,
    },

    
})


const ProductOffer= mongoose.model('ProductOffer',ProductOfferSchema)

module.exports = ProductOffer;
