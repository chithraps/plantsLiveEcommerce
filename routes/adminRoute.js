const express = require('express');
const cookieParser = require('cookie-parser')
const auth = require('../middlewares/adminAuth')

// importing controllers
const adminController = require('../controllers/admin/adminController')
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController')
const couponController = require('../controllers/admin/couponController')
const orderController = require('../controllers/admin/orderController')
const offerController = require('../controllers/admin/offerController')
const bannerController = require('../controllers/admin/bannerController')
const multer = require('../config/multer')

const admin_rout = express();



admin_rout.use(cookieParser())



admin_rout.set('views', './views/admin');

admin_rout.get('/',auth.isLogout, adminController.loadLogin);

admin_rout.post('/', adminController.verifyLogin)

admin_rout.get('/adminHome',auth.isLogin,adminController.loadDashboard)

admin_rout.get('/listUsers',auth.isLogin,adminController.loadUsers)

admin_rout.get('/blockOrUnblock',auth.isLogin,adminController.blockOrUnblock)

admin_rout.get('/createUser',auth.isLogin,adminController.loadRegistration)

// admin_rout.post('/createUser',adminController.createUser)

admin_rout.get('/edit',auth.isLogin,adminController.editUser)

admin_rout.post('/edit',adminController.updateUser)

admin_rout.get('/delete',auth.isLogin,adminController.deleteUser)

//category management
admin_rout.get('/viewCategories',auth.isLogin,categoryController.loadCategory)

admin_rout.get('/addCategory',auth.isLogin,categoryController.loadAddCategory)

admin_rout.post('/addCategory',categoryController.addCategory)

admin_rout.get('/editCategory',auth.isLogin,categoryController.loadeditCategory)

admin_rout.post('/editCategory',categoryController.editCategory)

admin_rout.get('/deleteCategory',auth.isLogin,categoryController.deleteCategory)

//product management

admin_rout.get('/addProduct',auth.isLogin,productController.loadAddProduct)

admin_rout.post('/addProduct',multer.upload.array('images', 5), productController.addProduct)

admin_rout.get('/viewProducts',auth.isLogin,productController.viewProducts)

admin_rout.get('/editProduct',auth.isLogin,productController.loadEditProduct)

admin_rout.post('/editProduct',multer.upload.array('images', 5),productController.editProduct)

admin_rout.get('/deleteProduct',auth.isLogin,productController.deleteProduct)

admin_rout.get('/deleteProductImage',auth.isLogin,productController.deleteProductImage)

//Offer management

admin_rout.post('/addProductOffer',offerController.addOfferOnProduct)

admin_rout.post('/addCategoryOffer',offerController.addOfferOnCategory)


//coupon management

admin_rout.get('/createCoupon',auth.isLogin,couponController.loadCreateCoupon)

admin_rout.post('/createCoupon',couponController.createCoupon)

admin_rout.get('/viewCoupons',auth.isLogin,couponController.loadViewCoupon)

admin_rout.get('/editCoupon',auth.isLogin,couponController.loadEditCoupon)

admin_rout.post('/editCoupon',auth.isLogin,couponController.editCoupon)

admin_rout.get('/deleteCoupon',auth.isLogin,couponController.deleteCoupon)

//order management

admin_rout.get('/viewAllOrders',auth.isLogin,orderController.viewAllOrders)

admin_rout.get('/viewOrderedProducts',auth.isLogin,orderController.viewOrderedProducts)

admin_rout.post('/updateStatus',orderController.updateStatus)

admin_rout.get('/viewCancelledOrder',auth.isLogin,orderController.viewCancelledOrders)

admin_rout.post('/approveCancel',orderController.approveAndRefund)

//banner management

admin_rout.get('/addBanner',auth.isLogin,bannerController.loadBanner)

admin_rout.post('/addBanner',multer.bannerUpload.single('image'),bannerController.addBanner)

//sales report

admin_rout.get('/salesReport',auth.isLogin,adminController.viewSalesReport)

admin_rout.post('/getOrdersByDate',adminController.getSalesReport)

//admin logout
admin_rout.get('/logout',auth.isLogin,adminController.logoutAdmin)

module.exports = admin_rout;
