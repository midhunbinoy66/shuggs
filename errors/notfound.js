const cutsomeAPIError = require("./customeAPIError");
const {StatusCodes} = require('http-status-codes')

class notfound extends cutsomeAPIError{
    constructor(message){
        super(message);
        this.statusCode = StatusCodes.NOT_FOUND;
    }
}

module.exports = notfound;
