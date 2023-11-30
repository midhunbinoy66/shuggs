const mongoose = require('mongoose');


const wishlistSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
        unique:true,
    },
    items:[
    {
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required:true,
        },
        createdAt:{
            type:Date,
            default:Date.now(),
        }

    }

    ]
        
})

const Wishlist = mongoose.model('Wishlist',wishlistSchema)
module.exports = Wishlist;