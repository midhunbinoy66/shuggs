const jwt = require('jsonwebtoken');
const badRequetsError = require('../errors/badrequest');
const cutsomeAPIError = require('../errors/customeAPIError');

const logginSupport = async (req,res,next)=>{
const token = req.cookies.token;
// if(!token){
//     return res.redirect('/api/v1/user/login')
// }

if(!token){
   return  next();
}

// if(token ==='logout'){
//  return res.render('login')
// }

try {
    const payload =jwt.verify(token,process.env.JWT_SECRET);
    req.user ={userId:payload.userId,name:payload.name,role:payload.role,email:payload.email};
    next();

} catch (error) {
 
    return res.render('notauth')
}
  
}


module.exports = logginSupport