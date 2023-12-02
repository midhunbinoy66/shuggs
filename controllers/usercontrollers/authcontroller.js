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


const registerUser = async (req,res)=>{


        try {
            
        const {name,email,password,mobile,confirmPassword} = req.body;

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
        const user = new User({
            name:name,
            email:email,
            password:hashedPassword,
            otp:otp,
            mobile:mobile,
        })
        const userData = await user.save();
        console.log(userData);
        res.redirect('/api/v1/user/verification')

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
                res.redirect('/api/v1/user/verification')
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
    res.redirect('/api/v1/user/login');
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
        res.render('verification',{ passMessage:'password changed Successfully' });
    } else {
        res.render('verification',{message: 'Invalid OTP or Email'})
    }
    
}






const loadLogin = async(req,res)=>{
    let errors;
    res.render('login',{errors})
}


const logoutUser =async (req,res)=>{
    res.cookie('token','logout',{httpOnly:true,expires:new Date(Date.now()+5000)})  
    res.redirect('/api/v1/user/login')  
}



