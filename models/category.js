const mongoose = require('mongoose');



const categorySchema = new mongoose.Schema({

    name:{
        type:String,
        enum:{
            values:['Formal','Athletic','Outdoor','Casual','Football','Tennis','Running'],
            message:'{VALUE} not supported'
        },
        required:true,

    },
    description:{
        type:String,
        required:true,
    }

})


const Category = mongoose.model('Category',categorySchema);
module.exports =Category;
