const ProductOffer = require("../../models/productOffer");

const loadAllProductOffers = async (req,res)=>{
    try {
        const productOffers = await ProductOffer.find().populate('product');
        res.render('allproductoffers',{productOffers});
    } catch (error) {
        console.log(error.message);
    }
}


const loadAddProductOffer = async (req,res)=>{
    try {
        let errors;
        res.render('addproductoffer',{errors})
    } catch (error) {
        console.log(error.message);
    }
}

const addCategoryOffer = async( req,res)=>{
    try {
    const {name,value,categoryName} = req.body;
    const category = await Category.findOne({name:categoryName});
    const categoryOffer = new CategoryOffer({
        name:name,
        value:value,
        category:category._id
    })        
    await categoryOffer.save();
    res.redirect('/admin/allcategoryoffers');
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {loadAllProductOffers}