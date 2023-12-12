const cutsomeAPIError = require('../../errors/customeAPIError');
const Admin = require('../../models/admin');
const Order = require('../../models/order');



const loadAdminLogin = async (req,res)=>{
    res.render('login')
}

const loadAdminRegister =async (req,res)=>{
    let errors;
    res.render('register',{errors});
}

const adminRegister =async (req,res)=>{
    try {
        const admin = await Admin.create({...req.body});
        if(admin){
         return res.redirect('/admin/login')
        }
        
    } catch (error) {
        if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('register', { errors }); // Pass errors to the view
        } 
        else {
            let errors;
            res.render('register', { errors ,message:"Email has already been registered,please use unique "});
        }
    }

}

const adminLogin = async (req,res)=>{
    const {email,password} =req.body;
    const admin =await Admin.findOne({email:email});
    if(!admin){

      return  res.render('login',{message:"please enter valid credentials"});
    }
    const passMatch = await admin.checkPassword(password);
    if(!passMatch){
        return  res.render('login',{message:"please enter valid credentials"});
    }  
    const token = await admin.createToken();
    console.log(token);
    const oneDay = 1000 * 60 *60*24;
    res.cookie('token',token,{httpOnly:true,expires:new Date(Date.now()+oneDay)})
    res.redirect('/admin/admindash');

}


const loadAdminDash = async(req,res)=>{
try {

    const recentOrder = await Order.findOne({}).sort({createdAt:-1}).populate('user').populate('address').populate('products.product')

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0); // Set time to 00:00:00


const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59

// Find orders placed today
const todayOrders = await Order.find({
  createdAt: { $gte: startOfDay, $lte: endOfDay }
}).populate('user').populate('address').populate('products.product');



const totalSalesData = todayOrders.map(order=>{
    const orderid=order._id;
    const total = order.products.reduce((acc,product)=>{
        acc += product.discountedPrice * product.quantity;
        return acc;
    },0)
    const paymentMethod = order.payment;
    const status = order.status;
    return { orderId: orderid, totalSales: total ,payment:paymentMethod,status:status}
})

    res.render('admindashboard',{recentOrder,todayOrders,totalSalesData})

    
} catch (error) {
    console.log(error.message);
}


}


const adminLogout=async (req,res)=>{
    res.clearCookie('token'); // Clear the 'token' cookie
    res.redirect('/admin/login'); // Redirect to the login page
}




module.exports = { loadAdminLogin,adminRegister,loadAdminDash,adminLogin,loadAdminRegister,adminLogout}