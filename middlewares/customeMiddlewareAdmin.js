

const checkLoggedin = async (req,res,next)=>{

    if(req.user){
        return res.redirect('/api/v1/admin/admindash')
    }
    next();
}

module.exports = checkLoggedin;