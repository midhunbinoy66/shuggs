const { StatusCodes } = require("http-status-codes")
const cutsomeAPIError = require("../errors/customeAPIError")

const errorHandlerMiddleware =  (err,req,res,next)=>{
    if(err instanceof cutsomeAPIError){
        return res.status(err.statusCode).json({msg:err.message})
    }
    return    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:err.message});
}

module.exports = errorHandlerMiddleware;
