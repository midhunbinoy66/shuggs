const Coupon = require("../../models/coupons");


const getAllCoupons = async (req,res)=>{
    const coupons = await Coupon.find();
    res.render('allcoupons',{coupons})
}



const loadAddCoupons = async (req,res)=>{
    let errors
    res.render('createcoupon',{errors});

}


const addCoupons = async(req,res)=>{
    try {
        const {code,discountType,discountAmount,expiryDate} = req.body;
        const coupon = new Coupon({
            code:code,
            discountType:discountType,
            discountAmount:discountAmount,
            expiryDate:expiryDate
        })    
        await coupon.save();
        res.redirect('/api/v1/admin/addcoupons/?message:"Coupon added succesfully"')

    } catch (error) {
        if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('createcoupon', { errors }); // Pass errors to the view
        } 

        else {
            let errors;
            // res.status(500).send('Internal Server Error');
            res.render('createcoupon',{ errors,message:'your not providing accurate values , please check again' });
        }
    }
    
}


const loadEditCoupons = async (req, res) => {
  try {
    let errors;
    const couponId = req.params.id;
    const coupon = await Coupon.findById({ _id: couponId });
    res.render("editcoupon", { coupon, errors });
  } catch (error) {
    console.log(error.message);
  }
};

const editCoupon = async (req,res)=>{
    try {
        console.log('hi')
        const {couponcode,discountType,discountAmount,expiryDate} = req.body;
        const couponId = req.params.id;
        const coupon = await Coupon.findByIdAndUpdate({_id:couponId},{$set:{couponcode:couponcode,discountType:discountType,discountAmount:discountAmount,expiryDate:expiryDate}},{runValidators:true});
        res.redirect('/api/v1/admin/allcoupons')    

    } catch (error) {

        if (error.errors) {

            const coupon = await Coupon.findById({_id:req.params.id})
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('editcoupon', { coupon,errors }); // Pass errors to the view
        } 

        else {

            let errors;
            const coupon = await Coupon.findById({_id:req.params.id})
            res.render('editcoupon',{coupon, errors,message:'your not providing accurate values , please check again' });
        }
      
    }

}



const deleteCoupon = async(req,res)=>{
    const couponId = req.params.id;
    const coupon = await Coupon.findOneAndDelete({_id:couponId});
    res.redirect('/api/v1/admin/allcoupons')
}

module.exports = {
    loadAddCoupons,addCoupons,getAllCoupons,deleteCoupon,loadEditCoupons,editCoupon
}