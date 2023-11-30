const Category = require("../../models/category");
const Product = require("../../models/product");

const filterProducts = async (req,res)=>{
    try {
        const filter = {}
        if(req.query.name){
            filter.name= req.query.name
        }

        if(req.query.brand){
            filter.brand = req.query.brand
        }

        if(req.query.category){
            const categoryString = req.query.category;
            const category = await Category.findOne({name:categoryString});
            filter.category = category._id;
        }

        if(req.query.gender){
            filter.gender = req.query.gender
        }

        if(req.query.minPrice && req.query.maxPrice){
            console.log('hello')
            filter.price = {$gt:parseFloat(req.query.minPrice ),$lte:parseFloat(req.query.maxPrice)}
        }

        const pageNUmber = parseInt(req.query.page)||1;
        const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
        
        const startIndex = (pageNUmber-1)*10;
        const endIndex = pageNUmber *itemsPerPage;
        console.log(filter)
        const products = await Product.find(filter).skip(startIndex).limit(endIndex)
        console.log(products.length);

        res.status(200).json({success:true,products:products});
        
        
    } catch (error) {
        console.log(error.message)
    }
}


const regularSearch = async (req,res)=>{
    const search = req.query.search;
    const products = await Product.find({name:{$regex:new RegExp(search,'i')}});
    res.status(200).json({products:products});
}


module.exports = {filterProducts,regularSearch}