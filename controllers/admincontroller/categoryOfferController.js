const Category = require("../../models/category");
const CategoryOffer = require("../../models/categoryOffers");

const loadAllCategoryOffers = async (req,res)=>{
    try {
        const categoryOffers = await CategoryOffer.find().populate('category');
        res.render('allcategoryoffers',{categoryOffers});
    } catch (error) {
        console.log(error.message);
    }
}


const loadAddCategoryOffer = async (req,res)=>{
    try {
        let errors;
        res.render('addcategoryoffer',{errors})
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


module.exports = {loadAllCategoryOffers,loadAddCategoryOffer,addCategoryOffer}