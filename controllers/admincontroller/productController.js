const cutsomeAPIError = require('../../errors/customeAPIError');
const Category = require('../../models/category');
const Product = require('../../models/product')



const getAllProducts = async (req,res)=>{
    const products = await Product.find({isDeleted:false});
    res.render('allproduct',{products})
}



const loadAddProduct = async (req,res)=>{
    let errors;
    res.render('addproduct',{ errors });
}

const addproduct = async(req,res)=>{

    try {
        const {name,price,description,brand,sizes,quantities,gender} = req.body;
        const categoryData = await Category.findOne({name:req.body.category})
        const sizeVariants =[];
        
            for(let i=0;i<sizes.length;i++){
                sizeVariants.push({
                    size:sizes[i],
                    quantity:quantities[i]
                })
            }


        const category= categoryData._id;
        const images = req.files.map(file => file.filename)
        const product = new Product({ 
            name:name,
            price:price,
            description:description,
            brand:brand,
            category:category,
            sizes:sizeVariants,
            gender:gender,
            images:images
        });
        await product.save()
        res.redirect('/admin/products')
    
    } catch (error) {
        if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('addproduct', { errors }); // Pass errors to the view
        } 
        else {
            let errors;
            // res.status(500).send('Internal Server Error');
            res.render('addproduct',{ errors,message:'your not providing accurate values , please check again' });
        }
        
    }
 
}

const loadEditProduct = async (req,res)=>{
    let errors
    const {id} = req.params
    const product = await Product.findById({_id:id})
    res.render('editproduct',{product,errors});
}

const editProduct = async (req,res)=>{
    try {
        const {name,description,price,productId,brand,sizes,quantities,gender} = req.body;
        const categoryData = await Category.findOne({name:req.body.category})
        const category= categoryData._id;
        const sizeVariants =[];
        console.log(quantities,sizes);
        
            for(let i=0;i<sizes.length;i++){
                sizeVariants.push({
                    size:sizes[i],
                    quantity:quantities[i]
                })
            }
    
        const images = req.files.map(file => file.filename)
        const product = await Product.findByIdAndUpdate({_id:productId},{$set:{name:name,description:description,price:price,images:images,brand:brand,sizes:sizeVariants,category:category,gender:gender}})
        res.redirect('/admin/products');
        
    } catch (error) {
        const product = await Product.findById({_id:req.body.productId})
        if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('editproduct', { product,errors }); // Pass errors to the view
        } 
        else {
            let errors;
            // res.status(500).send('Internal Server Error');
            res.render('editproduct',{product,errors,message:'your not providing accurate values , please check again' });
        }
        
    }

}


const deleteProduct = async (req,res)=>{
    const id = req.params.id;
    await Product.findByIdAndUpdate({_id:id},{$set:{isDeleted:true}});
    res.redirect('/admin/products')
}

module.exports={loadAddProduct,addproduct,getAllProducts,loadEditProduct,editProduct,deleteProduct}