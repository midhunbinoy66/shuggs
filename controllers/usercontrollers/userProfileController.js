const Coupon = require("../../models/coupons");

const loadUserCoupons = async (req,res)=>{
    try {
        const coupons = await Coupon.find({})
        res.render('usercoupons',{coupons});
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = { loadUserCoupons}