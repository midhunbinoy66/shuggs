const mongoose = require('mongoose');


const categoryOfferSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:['fixed','percentage'],
        default:'percentage',
    },
    value:{
        type:Number,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required:true,
    },


})

const CategoryOffer = mongoose.model('CategoryOffer',categoryOfferSchema);
module.exports= CategoryOffer;