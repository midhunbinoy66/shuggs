const { StatusCodes } = require('http-status-codes');
const User =require('../../models/user');
const Product = require('../../models/product');
const Cart = require('../../models/cart');
const bcrypt = require('bcrypt');
const nodemailer =require('nodemailer');
const otpGenerator = require('otp-generator');
const Address = require('../../models/address');
const Order = require('../../models/order');
const Coupon = require('../../models/coupons')
const Category = require('../../models/category');
const { ObjectId } = require('mongoose').Types;
const {generateRandomString , sendResetEmail} = require('../../utils/passwordReset');
const { generateRandomStringForEmailChange, sendMailForEmailChange } = require('../../utils/emailchange');
const CartHistory = require('../../models/carthistory');
const ReturnProduct = require('../../models/returnSchema');
const WalletTransactions = require('../../models/walletTransactions')
const Razorpay = require('razorpay');
const Wishlist = require('../../models/wishlist');
const CategoryOffer = require('../../models/categoryOffers');
const ProductOffer = require('../../models/productOffer');
const { calculateTotal } = require('../../utils/coupon');
const notFound = require('../../middlewares/notfound');
var razorpay = new Razorpay({
    key_id: 'rzp_test_XTV4tqVFhaTx6m',
    key_secret: '2unUYBkxN3MAB5LM1Ax8sJRW',
  });




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USERNAME, // Your Gmail email address
      pass:process.env.SMTP_PASSWORD   // Your Gmail email password
    }
  });





const loginUser = async (req,res)=>{
    const {email,password} = req.body;
    const user = await User.findOne({email:email});
    if(!user){
      return  res.render('login',{message:"invalid credentials"})
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return  res.render('login',{message:"invalid credentials"})
    }

    if(user.blocked === true){
      return  res.render('login',{message:"your account is blocked ,please contact Admin"})
    }
    
    if(user.isVerified === false){
      return  res.render('login',{message:"your account is not verified ,please verify",})
    }
    const oneDay = 1000 * 60 *60*24;
    const token  = await user.createToken();
    res.cookie('token',token,{httpOnly:true,expires:new Date(Date.now()+oneDay)});
    res.redirect('/user/userdashboard')
}



const loadRegister = async (req,res)=>{
    let errors;
    res.render('register',{errors})
}


function passwordValidator(password){
    console.log('hello')
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    return passwordRegex.test(password);
}



function generateReferralCode(company,user){
    return company.substring(0,5)+user.substring(0,3)
}





const registerUser = async (req,res)=>{


        try {
            
        const {name,email,password,mobile,confirmPassword,referredUserCode} = req.body;

        if(password !== confirmPassword){
            let errors;
            return res.render('register', { errors ,message:"passwords does not match,please try again"});
        }
        
        if(!passwordValidator(password)){
            let errors;
            return res.render('register', { errors ,message:"passwords should contain at least one digit, one lowercase letter, one uppercase letter, and a length between 6 and 20 characters "});
        }
        const otp =  otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
        const hashedPassword = await bcrypt.hash(password, 10)
        const referralCode = generateReferralCode('SHUGGS',name)
        let userWallet =0;

        if(referredUserCode){
            const referredUser = await User.findOne({referralCode:referredUserCode});
            if(!referredUser){
                let errors;
                return res.render('register', { errors ,message:"This referral code does not exist"});
            }


            if(referredUser){
                referredUser.wallet +=200;
                const walletTransaction = new WalletTransactions({
                    user:referredUser._id,
                    amount:200,
                    type:'credit',
                    description:'Referral Success'
                })
                await walletTransaction.save();
                referredUser.walletTransactions.push(walletTransaction._id)
                userWallet=200;
                await referredUser.save();
            }
        }

        const user = new User({
            name:name,
            email:email,
            password:hashedPassword,
            otp:otp,
            mobile:mobile,
            referralCode:referralCode,
            wallet:userWallet
        })
        const userData = await user.save();


        console.log(userData);
        res.redirect('/user/verification')

                const mailOptions = {
            from: process.env.SMTP_USERNAME,
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP for email verification is: ${otp}`
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {       
                console.error(error);
                res.status(500).json({ message: 'Failed to send OTP nodemailer issue' });
            } else {
                console.log('Email sent: ' + info.response);
                // res.json({ message: 'OTP sent successfully' });
                res.redirect('/user/verification')
            }
        });

            
        } catch (error) {
            
                    if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('register', { errors }); // Pass errors to the view
        }
        
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            let errors;
            // Duplicate key error for the 'email' field
            // Handle the unique constraint violation error
            const errorMessage = 'Email address is already in use.';
            res.status(400).render('register', { errors,message: errorMessage });
          }    

        else{
            let errors;
            res.render('register', { errors ,message:" an internal error has occurred please try later "});
        }


        }


}


const loadForgotPassword = async (req,res)=>{
    res.render('forgotpassword')
}

const forgotpassword = async(req,res)=>{
    const {email} =  req.body;
    const user  = await User.findOne({email:email})
    if(!user){
        return res.render('forgotpassword',{message:"no user with this email exist"});
    }
    //if user exist generate random string and send it as email
    if(user.resetToken){
        return res.render('forgotpassword',{message:"a valid reset link is already send, please try after sometime"});
    }

    const resetToken  =  generateRandomString();
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now()+3600000;
    await user.save();

    sendResetEmail(email,resetToken);
    return res.render('forgotpassword',{message:"Password reset email sent successfully"});
}


const loadVerifyRestPassword =  async (req,res)=>{
const resetToken = req.params.id;
console.log(resetToken) 
res.render('verifyresetpassword',{resetToken});
}

const verifyResetPassword = async(req,res)=>{
    const resetToken = req.params.id;
    const {password ,confirmPassword ,token } = req.body;
    console.log(token);
    if(password !== confirmPassword){
        console.log('password mismatch');
        return res.render('verifyresetpassword',{resetToken});

    }
    const user = await User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}});
    if(!user){
        console.log('expired token');
        return res.render('verifyresetpassword',{resetToken});
    }
    

    const hashedPassword = await bcrypt.hash(password,10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration =undefined;
    await user.save();
    res.redirect('/user/login');
}

const loadVerification = async(req,res)=>{

    res.render('verification')
}



const verifyEmail = async (req,res)=>{
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otp, isVerified: false });

    if (user) {
        user.isVerified = true;
        await user.save();
        res.render('verification',{ passMessage:'email verifcation successfull' });
    } else {
        res.render('verification',{message: 'Invalid OTP or Email'})
    }
    
}






const loadLogin = async(req,res)=>{
    let errors;
    res.render('login',{errors})
}


const logoutUser =async (req,res)=>{
    // res.cookie('token','logout',{httpOnly:true,expires:new Date(Date.now()+5000)})  
    // res.redirect('/user/login')  
    res.clearCookie('token'); // Clear the 'token' cookie
    res.redirect('/user/login'); // Redirect to the login page
}



const loadUserDashboard = async(req,res)=>{
    const user = req.user;
    console.log(req.user);
    const products =await Product.find({isDeleted:false});
    res.render('userDashboard',{products});
}



const loadSingleProduct =async (req,res)=>{
    try {
        const productId =req.params.id;
        let message = req.query.message
        const product = await Product.findById({_id:productId});

        product.offerPrice = await checkAllOffer(product);
        res.render('singleproduct',{product,message});
    } catch (error) {
        console.log(error.message);
        notFound(req,res);
    }

}







const loadProductList = async (req,res)=>{
    try {
        const filter = {}
        filter.isDeleted = false;
        if(req.query.category){
            const category = await Category.findOne({name:req.query.category})
            if(category){
                filter.category= category._id;
            }
        }
        if(req.query.minPrice && req.query.maxPrice){
            filter.price = {$gte:parseFloat(req.query.minPrice),$lte:parseFloat(req.query.maxPrice)};
        }else if(req.query.minPrice){
            filter.price = {$gte:parseFloat(req.query.minPrice)}
        }else if(req.query.maxPrice){
            filter.price = {$lte:parseFloat(req.query.maxPrice)}
        }
    
        if(req.query.brand){
            filter.brand = req.query.brand
            
        }
        if(req.query.gender){
            filter.gender = req.query.gender
            
        }
    
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = parseInt(req.query.itemsPerPage) || 9;
    
        const startIndex= (page-1)* itemsPerPage;
        const endIndex=page*itemsPerPage;
        const totalProductsCount = await Product.countDocuments({});
        const totalPages = Math.ceil(totalProductsCount/itemsPerPage);
        const products =await Product.find(filter).skip(startIndex).limit(itemsPerPage).populate('category')
        
        for(let product of products){
            product.offerPrice = await checkAllOffer(product);
        }
        
        res.render('productlist',{products,filter,totalPages,currentPage:page});
    
    
    } catch (error) {
    
        console.log(error.message);
    }

}



const checkAllOffer = async (product)=>{

    const categoryOffer = await CategoryOffer.findOne({category:product.category._id||product.category});
    const productOffer = await ProductOffer.findOne({product:product._id});
    if(categoryOffer){
        
        return calculateDiscountedPrice(product.price,categoryOffer.value)
    }else if(productOffer){
    
        return calculateDiscountedPrice(product.price,productOffer.value)
    }else {
       return product.price; // No offer price
    }
}





const calculateDiscountedPrice = (originalPrice, discountValue) => {
    return originalPrice - (originalPrice * discountValue) / 100; // For percentage-based discount
  };
  





const loadCheckout = async(req,res)=>{
    try {
        let errors
        const message = req.query.message
        const userId = req.user.userId;
        let cart =await Cart.findOne({user:userId}).populate('items.product')
        const user  = await User.findById({_id:userId}).populate('addresses')
        // cart = await checkOffer(cart);
        // const products = cart.items.map(item =>item.product);
        for(let item of cart.items){
            item.offerPrice = await checkAllOffer(item.product)
        }
        
        res.render('checkout',{user,cart,errors,message})
    } catch (error) {
        console.log(error.message);
    }


}






const completeCheckout = async (req, res) => {
  try {
    console.log('checkout');
    let errors
    const userId = req.user.userId;
    const { addressId, payment, cartId} = req.body;
    
 
    let updatedCartItems=[];
    if(req.body.updatedCartItems){
        updatedCartItems = JSON.parse(req.body.updatedCartItems);
    }


    const user = await User.findById({ _id: userId }).populate("addresses");
    const cart = await Cart.findOne({ user: userId }).populate('items.product')

    if(!addressId || !payment){
        return res.render("checkout", {
            user,
            cart,
            errors,
            message: "hey , please choose address and Payment menthod",
          });
    //    return res.redirect('/user/checkout')
    }
    if (cart.items.length === 0 || !cart) {
      return res.render("checkout", {
        user,
        cart,
        errors,
        message: "hey , your cart is empty",
      });
    }




    const order = new Order({
      user: userId,
      cart: cartId,
      address: addressId,
      payment: payment,

    });




    // for(const item of cart.items){

    //     const product = item.product;
    //     const selectedSize = product.sizes.find(size=>size.size === item.size)
    //     selectedSize.quantity -= item.quantity;
    //     await product.save()

    // }



    const cartHistory = new CartHistory({
        user:userId,
        items:cart.items
    })




    await cartHistory.save();
    order.cartHistory = cartHistory._id;
    order.products = [];

    const itemToUse = updatedCartItems.length>0 ? updatedCartItems:cart.items
    let cartTotal =0;
    if(itemToUse == cart.items){
        for(let item of cart.items){
            item.discountedPrice = await checkAllOffer(item.product)
     
        }
    }

    
    for(const item of itemToUse ){
        cartTotal +=item.discountedPrice;
        const product = await Product.findById(item.product._id);
        const selectedSize = product.sizes.find(size => size.size === item.size);
        const productObject = {
            product : product._id,
            quantity : item.quantity,
            size :item.size,
            status :'pending',
            discountedPrice: item.discountedPrice,
        }
        order.products.push(productObject);
    }

    if(payment === 'Wallet'){
        if(user.wallet < cartTotal){
            
            // return res.render("checkout", {
            //     user,
            //     cart,
            //     errors,
            //     message: "Your wallet does not have sufficient Balance",
            //   });

            return res.redirect('/user/checkout?message=Sorry your wallet does not have sufficient balance ');
        }

        const walletTransaction = new WalletTransactions({
            user:userId,
            type:'debit',
            amount:cartTotal,
            description:'order Transaction',
        })
        await walletTransaction.save();
        user.walletTransactions.push(walletTransaction._id);
        user.wallet-=parseFloat(cartTotal);
    }


    cart.items = [];
    await cart.save();
    await order.save();
    await user.save();
    res.redirect(`/user/ordersuccess/${order._id}`)

  } catch (error) {
    console.log(error.message)
    if (error.errors) {
        const userId = req.user.userId;
        const cart =await Cart.findOne({user:userId}).populate('items.product')
        const user  = await User.findById({_id:userId}).populate('addresses')
      const errors = Object.values(error.errors).map((err) => err.message);
      res.render("checkout", { user,cart,errors }); // Pass errors to the view
    }
  }
};


const loadOrderSuccess = async(req,res)=>{
    try {
        const orderId = req.params.id;
        const order = await Order.findById({_id:orderId}).populate('products.product').populate('address')
        res.render('ordersuccess',{order})
    } catch (error) {
        console.log(error.message);
    }
}





const generateRazorpayOrder = async(req,res)=>{
    try {
        let { cartId, cartTotal,addressId ,updatedCartItems} = req.body;
        console.log(updatedCartItems,cartTotal);
        const cart = await Cart.findById({_id:cartId}).populate('items.product')

        // if(!updatedCartItems.discountedPrice){
        //     for(let item of updatedCartItems){
        //         item.discountedPrice = await checkAllOffer(item.product);
        //     }
        //     cartTotal = calculateTotal(updatedCartItems)
        // }

        if (!updatedCartItems.some(item => item.discountedPrice)) {
            
            for (let item of updatedCartItems) {
                if (!item.discountedPrice) {
                    item.discountedPrice = await checkAllOffer(item.product);

                }
            }
            cartTotal = calculateTotal(updatedCartItems);
        }

        // Create a Razorpay order
        const order = await razorpay.orders.create({
            amount: cartTotal * 100, // Amount in paise (Indian currency)
            currency: 'INR',
            receipt: 'order_receipt_' + Date.now(),
            payment_capture: 0, // Auto-capture the payment when order is successful
        });

        const razorpayOrderId = order.id;
        
  

        const cartHistory = new CartHistory({
            user:req.user.userId,
            items:cart.items
        })


        const newOrder = new Order({
            user:req.user.userId,
            cart:cartId,
            address:addressId,
            payment: 'Razorpay',
            status: 'payment_pending', // Or any other initial status
            razorpayOrderId: razorpayOrderId, // Associate Razorpay order ID
        })


        await cartHistory.save();
        newOrder.cartHistory = cartHistory._id;
        newOrder.products = [];

    




        const itemToUse = updatedCartItems.length>0 ? updatedCartItems:cart.items


        if(itemToUse == cart.items){
            
            for(let item of cart.items){
                item.discountedPrice = await checkAllOffer(item.product)
            }
        }




        for(const item of itemToUse ){
            const product = await Product.findById(item.product._id);
            const selectedSize = product.sizes.find(size => size.size === item.size);
            const productObject = {
                product : product._id,
                quantity : item.quantity,
                size :item.size,
                status :'pending',
                discountedPrice: item.discountedPrice,
            }
            newOrder.products.push(productObject);
        }
    
    
        await newOrder.save();
        // Extract the order ID
        const orderId = order.id;
        console.log(orderId);
        // Send the order ID back to the frontend
        res.json({orderId });
  
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
}



const loadRazorpayCheckout = async(req,res)=>{
    console.log(`order id is ${ req.query.orderId} `)
    res.render('razorpay_checkout', { orderId: req.query.orderId });
  
}


const razorpaySuccess = async (req,res)=>{
    const {orderId}= req.query;
    try {
        
        const order = await Order.findOne({razorpayOrderId:orderId})
        .populate('cart')
        .populate('products.product')
        .populate('address');
        
        const cart = await Cart.findById({_id:order.cart._id}).populate('items.product')
        await Order.findOneAndUpdate({razorpayOrderId:orderId},{$set:{status:'paid'}})
        
    for(const item of cart.items){

        const product = item.product;
        const selectedSize = product.sizes.find(size=>size.size === item.size)
        selectedSize.quantity -= item.quantity;
        await product.save()

    }


        cart.items = [];
        await cart.save();
        await order.save();
        res.render("ordersuccess",{order});



    } catch (error) {
        console.error('Error in razorpaySuccess route:', error);
        res.status(500).send('Internal Server Error');
    }

}


const razorpayFailure = async(req,res)=>{
    res.render('razorpayfailure');

}







const showAddress = async (req,res)=>{

    try {
        const userId = req.user.userId;
        const user  = await User.findById({_id:userId}).populate('addresses')
        res.render('useraddress',{user});
    } catch (error) {
        console.log(error.message);
    }
    
}





const loadAddAddress = async (req,res)=>{
    let errors
    res.render('addaddress',{errors});
}

const addAddress = async (req,res)=>{

try {

    const userId = req.user.userId;
    const {city,locality,district,state,zipcode} = req.body;
    let address =new Address({
        locality:locality,
        city:city,
        district:district,
        state:state,
        zipcode:zipcode        
    })
    await address.save();
    const user = await User.findByIdAndUpdate({_id:userId},{$push:{addresses:address._id}},{new:true});

    return  res.redirect('/user/useraddress')
} catch (error) {        
    if (error.errors) {
const errors = Object.values(error.errors).map(err => err.message);
 return res.render('addaddress', { errors }); // Pass errors to the view
}
}

}




const deleteAddress = async (req,res)=>{
    console.log('hello');
    const addressId = req.params.id;
    await Address.findByIdAndDelete({_id:addressId})
    res.redirect('/user/useraddress')
}

const loadUserHome = async (req,res)=>{
    //you have to show user details with a sidebar for navigation
    const userId = req.user.userId;
    const user = await User.findById({_id:userId});
    res.render('userhome',{user});
}

const loadEditProfile = async (req,res)=>{
    let errors;
    const userId = req.user.userId;
    const user = await User.findById({_id:userId});
    res.render('editprofile',{user,errors});
}

const editProfile = async (req,res)=>{
    try {
     
    const userId = req.user.userId;
    const {name,mobile} =req.body;
    const user = await User.findByIdAndUpdate({_id:userId},{$set:{name:name,mobile:mobile}},{new:true,runValidators:true});
   return res.redirect('/user/userhome')
       
    } catch (error) {
        const user = await User.findById({_id:req.user.userId});
        if (error.errors) {
            const errors = Object.values(error.errors).map(err => err.message);
           return res.render('editprofile', { user,errors }); // Pass errors to the view
        }
        
        // if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        //     let errors;
        //     const errorMessage = 'Email address is already in use.';
        //    return res.status(400).render('editprofile', { user,errors,message: errorMessage });
        //   }    

        else{
            let errors;
           return res.render('editprofile', {user,errors ,message:" an internal error has occurred please try later "});
        }
   
    }
}




const loadChangeEmail = async (req,res)=>{
    res.render('editemail')
}


const sendTokenForMail = async (req,res)=>{
    try {
        const {newEmail} = req.body;
        const existingUser = await User.findOne({email:newEmail});
        if(existingUser){
            return res.render('editemail',{message:"this email is already in use, please choose another one"});
        }
        const email = req.user.email;
        const token =  otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
        const user = await User.findOne({email:email});
        if(user.emailResetToken){
            return res.render('editemail',{message:"a valid reset link is already send, please try after sometime"});
        }
    
        user.emailResetToken = token,
        user.emailResetTokenExpiration = Date.now()+3600000;
        user.save();
        sendMailForEmailChange(newEmail,token);
        res.redirect('/user/emailchangeverify')
        
    } catch (error) {
        return res.render('editemail',{message:"Reset email connot be send at this moment,please try after sometime"});
    }    

}


const loadEmailChangeVerification = async(req,res)=>{
    res.render('emailchangeverify')
}


const EmailChangeVerification = async(req,res)=>{
    const {newEmail,token} = req.body;
    if(newEmail === req.user.email){
        return res.render('emailchangeverify',{message:'new email cannot be same as existing email'});
    }
    const user = await User.findOne({emailResetToken:token,emailResetTokenExpiration:{$gt:Date.now()}});
    if(!user){
        console.log('expired token');
        return res.render('emailchangeverify',{message:'token expired , please try again'});
    }

    user.email = newEmail;
    user.emailResetToken= undefined;
    user.emailResetTokenExpiration =undefined;
    await user.save();
    res.redirect('/user/userhome');
    
}








const loadChangePassword = async (req,res)=>{
    let errors
    res.render('changepassword',{errors});
}


const changePassword  = async (req,res)=>{
    try {
        console.log('hello')
        let errors;
        const userId = req.user.userId;
        const user = await User.findById({_id:userId})
        console.log(user);
        const {currentPassword,newPassword,confirmPassword} = req.body;
        console.log(currentPassword,newPassword,confirmPassword);
        if(newPassword !== confirmPassword){
            
           return  res.render('changepassword',{message:"new password and confirmPassword matching",errors})
        }
        const isPasswordMatch = await bcrypt.compare(currentPassword,user.password)
        if(!isPasswordMatch){

            return res.render('changepassword',{message:"password not matching",errors})
        } 

        if(!passwordValidator(newPassword)){
            let errors;
            return res.render('changepassword', { errors ,message:"passwords should contain at least one digit, one lowercase letter, one uppercase letter, and a length between 6 and 20 characters "});
        }
        console.log("just before passwordHash")
        const hashedPassword = await bcrypt.hash(newPassword,10);
        console.log("password hashed")
        // user = await User.findByIdAndUpdate({_id:userId},{$set:{password:hashedPassword}},{new:true})
        user.password = hashedPassword;
        user.save();
            console.log('password changed')
        return res.render('changepassword',{errors,passMessage:'password changed Successfully'})
    } catch (error) {
        if (error.errors) {
            console.log('error in passord change')
            const errors = Object.values(error.errors).map(err => err.message);
            res.render('changepassword', { errors }); // Pass errors to the view
    }
}

}



const loadUserOrders  = async (req,res)=>{
    const userId = req.user.userId;

const orders = await Order.find({user:userId}).populate('products.product').populate('user').populate('address').sort({createdAt:-1})
    let message = req.query.message
    res.render('userorders',{orders,message});

}


const loadConfirmCancel = async(req,res)=>{
    const orderId = req.params.id;
    const userId = req.user.userId
    const order = await Order.findById({_id:orderId}).populate('products.product').populate('user').populate('address').populate('products');
    res.render('confirmcancel',{order});
}



const cancelOrder = async (req,res)=>{
    const orderId = req.params.id;
    const userId = req.user.userId
    console.log(orderId);
    const user = await User.findById({_id:userId});
    const orderStatus = await Order.findById({_id:orderId}).populate('products.product')
    if(orderStatus.status === 'paid'){
        orderStatus.products.forEach(async product => {
            if(product.status !== 'cancelled' && product.status !=='returned'){
                let productPrice = isNaN(product.discountedPrice)?product.product.price:product.discountedPrice 
                
                user.wallet += parseInt(product.quantity * productPrice) ;
                const walletTransaction = new WalletTransactions({
                    user:userId,
                    amount:parseInt(product.quantity * productPrice),
                    type:'credit',
                    description:'product cancellation refund',
                })

                await walletTransaction.save();
                user.walletTransactions.push(walletTransaction._id)


            }
            
        });
    }
    const order = await Order.findByIdAndUpdate({_id:orderId},{$set:{status:'cancelled'}});
    await orderStatus.save();
    await user.save();
    res.redirect('/user/userorders');
}


const cancelSingleProduct =async (req,res)=>{
    const userId = req.user.userId
    const productId = req.params.id;
    const orderId = req.query.orderId;
    const user = await User.findById({_id:userId});
    const order = await Order.findById({_id:orderId})

    console.log(productId,orderId);
    if (!order) {
      
        return res.status(404).json({ error: 'Order not found' });
    }

    const selectedProduct = order.products.find(product => product.product.toString() === productId);
    if (!selectedProduct) {
      
        return res.status(404).json({ error: 'Product not found in the order' });
    }

 
    const product = await Product.findOne({_id:selectedProduct.product.toString()});


    if (!product) {
        return res.status(404).json({ error: 'Corresponding product not found' });
    }

    const selectedSize = product.sizes.find(size =>size.size === selectedProduct.size );

    if(selectedProduct.status === 'cancelled' || selectedProduct.status === 'returned' || order.status === 'cancelled'){
      return  res.redirect('/user/userorders?message="the product is already cancelled or retured"');
    }

    
    const productPrice = isNaN(selectedProduct.discountedPrice)?product.price:selectedProduct.discountedPrice

    selectedSize.quantity += selectedProduct.quantity;
    selectedProduct.status = 'cancelled';
    
if(order.status === 'paid'){
    user.wallet += parseInt(selectedProduct.quantity * productPrice) ;
    const walletTransaction = new WalletTransactions({
        user:userId,
        amount:parseInt(selectedProduct.quantity * productPrice),
        type:'credit',
        description:'product cancellation refund',
    })

    await walletTransaction.save();
    user.walletTransactions.push(walletTransaction._id)
}

    await order.save();
    await user.save();
    await product.save();
    res.redirect('/user/userorders');

}




const searchProduct = async (req,res)=>{
    const filter = {}
    filter.isDeleted = false;
    const search = req.query.search;


    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 9;

    const startIndex= (page-1)* itemsPerPage;
    const endIndex=page*itemsPerPage;
    const totalProductsCount = await Product.countDocuments({});
    const totalPages = Math.ceil(totalProductsCount/itemsPerPage);


    const products =await Product.find({name:{$regex: new RegExp(search,'i')}}).skip(startIndex).limit(itemsPerPage);
    res.render('productlist',{products,filter,totalPages,currentPage:page});

}


const loadReturnProduct = async(req,res)=>{

    try {
        const productId = req.params.id;
        const {orderId,quantity,size} = req.query
        const order = await Order.findById({_id:orderId})
        const productData = await Product.findById({_id:productId});
        const product = order.products.find(product=>product.product.toString()=== productId);
        product.name = productData.name
        console.log(product);
        res.render('returnproduct.ejs',{order,product,productId});
    } catch (error) {
        throw notFound(req,res);
    }
}


const returnProduct = async(req,res)=>{
    try {
        const productId = req.params.id;
        const {size,quantity,orderId} = req.query
        const product = await Product.findById({_id:productId})
        const order = await Order.findById({_id:orderId});
        const selectedSize = product.sizes.find(shoe=> shoe.size === size);
        if (!product) {
            return res.status(404).json({ error: 'product is not found' });
        }
        const selectedVariant = order.products.find(product => product.product.toString()=== productId && product.size === size);
        console.log(selectedVariant);
        selectedVariant.status = 'returned';
        await order.save()

        if (!selectedSize) {
            return res.status(404).json({ error: 'Size variant not found' });
        }

        selectedSize.quantity +=parseInt(quantity);
        selectedSize.status = 'returned';
        await product.save();
        const returnProduct = new ReturnProduct({
            orderId:orderId,
            productId:productId,
            reason:req.body.reason,

        })

        
        await returnProduct.save();
        res.redirect('/user/userorders')
    } catch (error) {
        res.send({error:error.message})
    }

}



const loadWallet = async(req,res)=>{
    try {
        const userId = req.user.userId;
        const user = await User.findById({_id:userId}).populate('walletTransactions')
        if(!user){
            return res.status(404).json({message:"no such user found"})
        }        
        
        res.render('userwallet',{user})

    } catch (error) {
        res.status(500).json({message:'Something went wrong, please try again'})
    }
}


const loadSample = async (req,res)=>{
    res.render('ordersuccess')
}



const addToWishlist = async(req,res)=>{
    const userId = req.user.userId
    const productId = req.params.id;
    const product = await Product.findById({_id:productId});
    let userWishlist = await Wishlist.findOne({user:userId});

    
    if(!userWishlist){ 
         userWishlist =  new Wishlist({
            user:userId,
            items:[]        

        })
    }
    const exitsingItem = userWishlist.items.find(item =>item.product.toString() ===  productId)
   
    if(!exitsingItem){
       userWishlist.items.push({product:product._id})
    }

    await userWishlist.save();
    res.redirect('/user/wishlist')
}


const loadWishlist = async (req,res)=>{
    const userId  = req.user.userId;
    const userWishlist = await Wishlist.findOne({user:userId}).populate('items.product')
    if(!userWishlist){
        return res.render('wishlist')
    }  
    res.render('wishlist',{userWishlist})

} 


const removeWishlist = async (req,res)=>{
    const userId = req.user.userId;
    const productId = req.params.id;
    const wishlist = await Wishlist.findOne({user:userId});
    if(!wishlist){
        res.json({success:true,message:"no wishlist found"});
    }

    await Wishlist.findByIdAndUpdate({_id:wishlist._id},{$pull:{items:{product:productId}}});
    res.redirect('/user/wishlist')
    
}




module.exports ={
    registerUser,loginUser,loadRegister,
    loadLogin,loadUserDashboard,logoutUser,loadVerification,verifyEmail,
    
    loadSingleProduct,
    loadProductList,
  
    // addToCart,loadCart,editCartQuantity,deleteCartItem,applyCoupon

    loadUserHome,showAddress,loadAddAddress,addAddress,loadCheckout,completeCheckout,
    loadUserOrders,loadEditProfile,editProfile,loadChangePassword,changePassword,loadConfirmCancel,
    cancelOrder,loadForgotPassword,forgotpassword,loadVerifyRestPassword,verifyResetPassword,deleteAddress,loadChangeEmail,
    loadEmailChangeVerification,sendTokenForMail,EmailChangeVerification,cancelSingleProduct,searchProduct,loadRazorpayCheckout,generateRazorpayOrder,
    razorpaySuccess,loadReturnProduct,returnProduct,loadWallet,loadSample,razorpayFailure,addToWishlist,loadWishlist,
    removeWishlist,loadOrderSuccess

}


