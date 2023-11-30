const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
        name:{
            type:String,
            required: [true, 'Product name is required'],
            minlength: [3, 'Product name must be at least 3 characters long.'],
            maxlength: [45, 'Product name cannot exceed 100 characters.'],
            validate: {
                validator: function(value){
                    return value.trim().length >0;
                },
                message:'Product name cannot consist of only spaces.'
            }
        },
        price:{
            type:Number,
            required:true,
            min: [0, 'Price cannot be negative'],
        },
        description:{
            type:String,
            required:true,
            minlength: [10, 'Product description must be at least 10 characters long.'],
            maxlength: [1000, 'Product description cannot exceed 1000 characters.'],
        },
        images:{
            type:Array,
            required:true
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required:true,
            
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        brand:{
            type:String,
            enum:{
                values:['Nike','Adidas','Puma','New Balance'],
                message:'{VALUE} is not supported'    
            }
            
        },
        sizes:[{
            size:String,
            quantity:{
                
                type:Number,
                min:[0,'The product is out of stock ,sorry for  the inconvinience']
            },
            status: {
                type: String,
                enum: ['available', 'out_of_stock', 'returned'],
                default: 'available',
            },
        }
        ],
        gender:{
            type:String,
            enum:['male','female','unisex'],
            message:'{VALUE} is not supported',
            default:'unisex'
        }
})



const Product = mongoose.model('Product', productSchema);
module.exports = Product;