const mongoose =require('mongoose');


const walletTransactionsSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    amount:{
        type:Number,
        required:true
    },
    type:{
        type:String,
        enum:['debit','credit'],
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now(),
    },
})


const WalletTransactions = new mongoose.model('WalletTransactions',walletTransactionsSchema) ;

module.exports = WalletTransactions;