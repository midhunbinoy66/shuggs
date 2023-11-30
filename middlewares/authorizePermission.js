const authorizePermissions = (...roles)=>{
  return (req,res,next)=>{
    if(!roles.includes(req.user.role)){
     return res.render('notauth')
    }
    next()

  }
}

module.exports = authorizePermissions;

