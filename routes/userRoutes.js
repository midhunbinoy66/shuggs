const express =require('express');
const {
  loginUser,
  registerUser,
  loadRegister,
  loadLogin,

  logoutUser,

  loadVerification,
  verifyEmail,
 
  // addToCart,
  // loadCart,
  // editCartQuantity,
  // deleteCartItem,
  loadfilterproduct,
  loadProductList,
  loadUserDashboard,
  loadSingleProduct,
  loadUserHome,
  showAddress,
  loadAddAddress,
  addAddress,
  loadCheckout,
  completeCheckout,
  loadUserOrders,
  loadEditProfile,
  editProfile,
  loadChangePassword,
  changePassword,
  loadConfirmCancel,
  cancelOrder,
  // loadForgotPassword,
  // forgotpassword,
  loadVerifyRestPassword,
  verifyResetPassword,
  loadSimple,
  deleteAddress,
  loadChangeEmail,
  loadEmailChangeVerification,
  sendTokenForMail,
  EmailChangeVerification,
  cancelSingleProduct,
  // applyCoupon,
  searchProduct,
  loadRazorpayCheckout,
  generateRazorpayOrder,
  razorpaySuccess,
  loadReturnProduct,
  returnProduct,
  loadWallet,
  loadSample,
  loadForgotPassword,
  forgotpassword,
  razorpayFailure,
  addToWishlist,
  loadWishlist,
  removeWishlist,
  loadOrderSuccess,
} = require("../controllers/usercontrollers/userController");
const { loadCart, editCartQuantity, deleteCartItem, addToCart, applyCoupon, getCartCount, downloadInvoice, getWishlistCount } = require('../controllers/usercontrollers/cartcontroller');
const router = express();
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const bodyParser =require('body-parser');
const Razorpay = require('razorpay');
var razorpay = new Razorpay({
    key_id: 'rzp_test_XTV4tqVFhaTx6m',
    key_secret: '2unUYBkxN3MAB5LM1Ax8sJRW',
  });




//middleware
const checkLoggedin =require('../middlewares/customeMiddleware')
const userAuth = require('../middlewares/authentication');
const authorizePermission = require('../middlewares/authorizePermission');
const { filterProducts, regularSearch } = require('../controllers/usercontrollers/randomtrials');
const { loadUserCoupons } = require('../controllers/usercontrollers/userProfileController');
const logginSupport = require('../middlewares/loginAuthChecker');

router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json());
router.set('views','./views/user')
router.use(express.static('public'))
router.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
  });


router.route('/login').post(loginUser).get([logginSupport,checkLoggedin],loadLogin)
router.route('/register').post(registerUser).get(loadRegister);
router.route('/forgotpassword').get(loadForgotPassword).post(forgotpassword);
router.route('/verifyresetpassword/:id').get(loadVerifyRestPassword).post(verifyResetPassword)
router.route('/verification').get(loadVerification).post(verifyEmail);
router.route('/userdashboard').get(userAuth,authorizePermission('user'),loadUserDashboard);
router.route('/logout').get(logoutUser);
router.route('/singleproduct/:id').get(userAuth,authorizePermission('user'),loadSingleProduct)
router.route('/productlist').get(userAuth,authorizePermission('user'),loadProductList)
router.route('/cart').get(userAuth,authorizePermission('user'),loadCart);
router.route('/cart/update/:id').post(userAuth,authorizePermission('user'),editCartQuantity);
router.route('/cart/delete/:id').post(userAuth,authorizePermission('user'),deleteCartItem);
router.route('/addtocart').post(userAuth,authorizePermission('user'),addToCart)
router.route('/userhome').get(userAuth,authorizePermission('user'),loadUserHome)
router.route('/useraddress').get(userAuth,authorizePermission('user'),showAddress);
router.route('/useraddress/:id').get(userAuth,authorizePermission('user'),deleteAddress)
router.route('/addaddress').get(userAuth,authorizePermission('user'),loadAddAddress).post(userAuth,authorizePermission('user'),addAddress)
router.route('/checkout').get(userAuth,authorizePermission('user'),loadCheckout).post(userAuth,authorizePermission('user'),completeCheckout)
router.route('/userorders').get(userAuth,authorizePermission('user'),loadUserOrders);
router.route('/editprofile').get(userAuth,authorizePermission('user'),loadEditProfile).post(userAuth,authorizePermission('user'),editProfile)
router.route('/changepassword').get(userAuth,authorizePermission('user'),loadChangePassword).post(userAuth,authorizePermission('user'),changePassword)
router.route('/confirmcancel/:id').get(userAuth,authorizePermission('user'),loadConfirmCancel).post(userAuth,authorizePermission('user'),cancelOrder)
router.route('/editemail').get(userAuth,loadChangeEmail).post(userAuth,sendTokenForMail);
router.route('/emailchangeverify').get(userAuth,loadEmailChangeVerification).post(userAuth,EmailChangeVerification)
router.route('/singleproductcancel/:id').get(userAuth,cancelSingleProduct);
router.route('/checkout/applycoupon').post(applyCoupon)
router.route('/search').get(userAuth,authorizePermission('user'),searchProduct);
router.route('/razorpay/checkout').get(userAuth,loadRazorpayCheckout);
router.route('/checkout/razorpay').post(userAuth,generateRazorpayOrder);
router.route('/razorpay/checkout/success').get(userAuth,razorpaySuccess)
router.route('/singleproductreturn/:id').get(userAuth,authorizePermission('user'),loadReturnProduct).post(userAuth,authorizePermission('user'),returnProduct)
router.route('/userwallet').get(userAuth,authorizePermission('user'),loadWallet)
router.route('/ordersuccess/:id').get(loadOrderSuccess)
router.route('/razorpay/checkout/failure').get(userAuth,razorpayFailure)
router.route('/addtowishlist/:id').get(userAuth,addToWishlist)
router.route('/wishlist').get(userAuth,loadWishlist)
router.route('/wishlist/remove/:id').post(userAuth,removeWishlist)
router.route('/trial/getallproducts').get(filterProducts)
router.route('/trial/searchproducts').get(regularSearch)
router.route('/cartcount').get(userAuth,getCartCount);
router.route('/wishlistcount').get(userAuth,getWishlistCount);
router.route('/downloadinvoice/:id').get(userAuth,downloadInvoice);
router.route('/usercoupons').get(userAuth,loadUserCoupons);



module.exports =router;