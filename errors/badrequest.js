const { StatusCodes } = require("http-status-codes");
const cutsomeAPIError = require("./customeAPIError");

class badRequetsError extends cutsomeAPIError{
    constructor(message){
        super(message);
        this.statusCode = StatusCodes.BAD_REQUEST;
    }
}

module.exports = badRequetsError;