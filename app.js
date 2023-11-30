require('dotenv').config()
require('express-async-errors');
const express = require('express');
const connectDB =require('./db/connectDB');
const notFound = require('./middlewares/notfound');
const errorHandlerMiddleware = require('./middlewares/errorHandler');
const { StatusCodes } = require('http-status-codes');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');
const multer = require('multer');
const Address = require('./models/address');
const Cart = require('./models/cart');
const Product = require('./models/product');
const CartHistory = require('./models/carthistory')




const PORT = process.env.PORT || 3000;
app.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
  });
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.set('view engine','ejs');
app.set('views','views/errorpages');
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/user',userRouter);
app.use('/api/v1/admin',adminRouter);

//middlewares 
app.use(notFound);
app.use(errorHandlerMiddleware);


const start = async ()=>{
    await connectDB(process.env.MONGO_URI)
    app.listen(PORT,console.log(`server is listening on port ${PORT}`));

}


start();