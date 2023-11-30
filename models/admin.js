const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'enter the admin name'],
        unique:true,
    },
    email:{
        type:String,
        required:[true,'enter the admin email'],
        unique:true,
    },
    password:{
        type:String,
        require:[true,'enter the admin password']
    }
}) 


adminSchema.pre('save',async function (){
    const salt =await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password,salt);
})

adminSchema.methods.checkPassword =async function (password){
const isMatch  = await bcrypt.compare(password,this.password);
return isMatch
}

adminSchema.methods.createToken = async function(){
    const token = await jwt.sign({ userId: this._id, name: this.name ,role:'admin'},"jwtSecret",{expiresIn:'30d'});
    return token;
}


module.exports = mongoose.model('admin',adminSchema);