

const checkLoggedin = async (req,res,next)=>{

    if(req.user){
        return res.redirect('/user/userdashboard')
    }
    next();
}

module.exports = checkLoggedin;