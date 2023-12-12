const Category = require("../../models/category");


const loadAllCategories = async (req,res)=>{
    const categories = await Category.find({})
    res.render('allcategory',{categories});
}


const loadAddCategory = async (req,res)=>{
    let errors
    res.render('addcategory',{errors});
}

const addCategory = async (req,res)=>{
    try {
        const category = await Category.create({...req.body});
        console.log(category);
        res.redirect('/admin/categorymanage')
    } catch (error) {
        if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('addcategory', { errors }); // Pass errors to the view
        } 
        else {
            let errors;
            // res.status(500).send('Internal Server Error');
            res.render('addcategory',{ errors,message:'your not providing accurate values , please check again' });
        }
    }
 
}

const loadEditCategory =async (req,res)=>{
    const id = req.params.id
    let errors
    const category = await Category.findById({_id:id})
    res.render('editcategory',{category,errors});
}


const editCategory = async (req,res)=>{
    try {   
        const id = req.params.id;
        const {name,description} = req.body;
        const category = await Category.findByIdAndUpdate({_id:id},{$set:{name:name,description:description}},{new:true, runValidators:true})
        res.redirect('/admin/categorymanage')
        
    } catch (error) {

        if (error.errors) {
            const id = req.params.id
            const category = await Category.findById({_id:id})
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('editcategory', { category,errors }); // Pass errors to the view
        } 
        else {
            let errors;
            // res.status(500).send('Internal Server Error');
            res.render('editcategory',{category,errors,message:'your not providing accurate values , please check again' });
        }
        
    }

}


const deleteCategory = async (req,res)=>{
    const id = req.params.id;
    await Category.findByIdAndDelete({_id:id});
    res.redirect('/admin/categorymanage')
}


module.exports ={ loadAddCategory,loadAllCategories,addCategory,editCategory,loadEditCategory,deleteCategory};