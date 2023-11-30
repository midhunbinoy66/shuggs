const cutsomeAPIError = require('../../errors/customeAPIError');
const Admin = require('../../models/admin');



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
         return res.redirect('/api/v1/admin/login')
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
    res.redirect('/api/v1/admin/admindash');

}


const loadAdminDash = async(req,res)=>{
    res.render('admindashboard')
}


const adminLogout=async (req,res)=>{
    res.cookie('token','logout',{httpOnly:true,expires:new Date(Date.now()+5000)})  
    res.redirect('/api/v1/admin/login')
}




module.exports = { loadAdminLogin,adminRegister,loadAdminDash,adminLogin,loadAdminRegister,adminLogout}