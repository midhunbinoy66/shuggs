

const checkLoggedin = async (req,res,next)=>{

    if(req.user){
        return res.redirect('/admin/admindash')
    }
    next();
}

module.exports = checkLoggedin;