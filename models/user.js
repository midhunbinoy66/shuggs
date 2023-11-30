const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const Address = require('./address')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "provide name"],
    minlength: 4,
    maxlength: 20,
    validate: {
      validator: function (value) {
        return value.trim().length > 0;
      },
      message: "name cannot be spaces only",
    },
  },
  email: {
    type: String,
    required: [true, "provide email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "provide password"],
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  mobile: {
    type: String,
    require: true,
    validate:{
      validator: function(value) {
        return /^\d{10}$/.test(value);
     },
     message: 'Provide a 10-digit mobile number'
    },
    default:'1234567890',
  },
  otp: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiration: {
    type: Date,
  },
  emailResetToken:{
    type:String
  },
  emailResetTokenExpiration:{
    type:Date,
  },
  addresses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
  ],

  wallet:{
    type:Number,
    default:0,
  },
  walletTransactions:[
    {
    type:mongoose.Schema.Types.ObjectId,
    ref:'WalletTransactions'
  },
],
referralCode:{
  type:String
},
// appliedCoupons:[{type:String}]
});


// userSchema.pre('save',async function(){
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password,salt);
    
// })


userSchema.methods.createToken = function(){
    return jwt.sign({userId:this._id,name:this.name,role:'user',email:this.email},process.env.JWT_SECRET,{expiresIn:'30d'});
    
}


// userSchema.methods.checkPassword =async function (password){
//     console.log(password)
//     console.log(this.password);
//     const isMatch = await bcrypt.compare(password,this.password);
//     console.log(isMatch)
//     return isMatch;
// }


const User = mongoose.model('User',userSchema);
module.exports = User;


