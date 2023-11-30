const express = require("express");
const router = express();
const bodyParser = require("body-parser");
const multer = require("multer");
const { appendFile } = require("fs");
const path = require("path");
const {
  loadAdminLogin,
  adminRegister,
  adminLogin,
  loadAdminRegister,
  loadAdminDash,
  adminLogout,
} = require("../controllers/admincontroller/adminController");
const {
  loadAddProduct,
  addproduct,
  getAllProducts,
  loadEditProduct,
  editProduct,
  deleteProduct,
} = require("../controllers/admincontroller/productController");
const {
  loadUserList,
  loadEditUser,
  editUser,
  deleteUser,
} = require("../controllers/admincontroller/adminUserController");
const {
  loadAddCategory,
  addCategory,
  loadAllCategories,
  loadEditCategory,
  deleteCategory,
  editCategory,
} = require("../controllers/admincontroller/categoryController");

const {
  loadAllOrders,
  loadManageOrder,
  orderStatusUpdate,
  cancelOrder,
  getOrderData,
  getSalesReportExcel,
  getSalesReportPdf,
  productOrderStatusUpdate,
  loadGenerateSalesReport,
} = require("../controllers/admincontroller/OrderController");

router.set("views", "./views/admin");
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use((req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/productImages"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });
const imagePath = path.join(__dirname, "../public");

router.use(express.static('public'))
// router.use(express.static(path.join(__dirname, "../public/productImages")));
const adminAuth = require("../middlewares/authentication");
const authorizePermissions = require('../middlewares/authorizePermission');
const { loadAddCoupons, addCoupons, getAllCoupons, deleteCoupon, loadEditCoupons, editCoupon } = require("../controllers/admincontroller/couponController");
const { loadAllCategoryOffers, loadAddCategoryOffer, addCategoryOffer } = require("../controllers/admincontroller/categoryOfferController");
const { loadAllProductOffers } = require("../controllers/admincontroller/productOfferController");



router.route("/register").get(loadAdminRegister).post(adminRegister);
router.route("/login").get(loadAdminLogin).post(adminLogin);
router.route("/admindash").get(adminAuth,authorizePermissions('admin'),loadAdminDash);
router.route("/logout").get(adminLogout);
router.route("/products").get(adminAuth,authorizePermissions('admin'),getAllProducts);
router
  .route("/addproduct")
  .get(adminAuth,authorizePermissions('admin'),loadAddProduct)
  .post(upload.array("images", 5), addproduct);
router
  .route("/editproduct/:id")
  .get(adminAuth,authorizePermissions('admin'),loadEditProduct)
  .post(upload.array("images", 5), editProduct);
router.route("/products/:id").get(adminAuth,authorizePermissions('admin'),deleteProduct);
router.route("/usermanage").get(adminAuth,authorizePermissions('admin'),loadUserList);
router
  .route("/usermanage/edituser/:id")
  .get(adminAuth,authorizePermissions('admin'), loadEditUser)
  .post(editUser);
router.route("/usermanage/deleteuser/:id").get(adminAuth,authorizePermissions('admin'), deleteUser);
router.route("/categorymanage").get(adminAuth,authorizePermissions('admin'), loadAllCategories);
router
  .route("/categorymanage/editcategory/:id")
  .get(adminAuth,authorizePermissions('admin'), loadEditCategory)
  .post(editCategory);
router
  .route("/categorymanage/deletecategory/:id")
  .get(adminAuth,authorizePermissions('admin'), deleteCategory);
router.route("/addcategory").get(adminAuth,authorizePermissions('admin'), loadAddCategory).post(addCategory);
router.route("/allorders").get(adminAuth,authorizePermissions('admin'), loadAllOrders);
router.route("/allorders/:id").get(adminAuth,authorizePermissions('admin'), cancelOrder);

router
  .route("/manageorder/:id")
  .get(adminAuth,authorizePermissions('admin'), loadManageOrder)
  .post(adminAuth, orderStatusUpdate);

router.route('/manageorder/singleproduct/:id').post(adminAuth,authorizePermissions('admin'),productOrderStatusUpdate)

  router.route('/allcoupons').get(adminAuth,authorizePermissions('admin'),getAllCoupons)
  router.route('/addcoupons').get(adminAuth,authorizePermissions('admin'),loadAddCoupons).post(adminAuth,addCoupons)
  router.route('/couponmanage/deletecoupon/:id').get(adminAuth,authorizePermissions('admin'),deleteCoupon)
  router.route('/couponmanage/editcoupon/:id').get(adminAuth,authorizePermissions('admin'),loadEditCoupons).post(adminAuth,editCoupon)
  router.route('/orderdata').get(adminAuth,getOrderData);
  router.route('/download-sales-report-excel').post(adminAuth,getSalesReportExcel);
  router.route('/download-sales-report-pdf').post(adminAuth,getSalesReportPdf);

  router.route('/allcategoryoffers').get(adminAuth,authorizePermissions('admin'),loadAllCategoryOffers);
  router.route('/addcategoryoffer').get(adminAuth,authorizePermissions('admin'),loadAddCategoryOffer).post(addCategoryOffer);
  router.route('/allproductoffers').get(adminAuth,authorizePermissions('admin'),loadAllProductOffers);
  router.route('/generatesalesreport').get(adminAuth,authorizePermissions('admin'),loadGenerateSalesReport)

  module.exports = router;
