const express = require("express")
const cookieParser = require('cookie-parser')

const usercontroller = require('../controllers/user/userController')

const cartController = require("../controllers/user/cartController")

const profileController = require("../controllers/user/profileController")

const checkOutController = require("../controllers/user/checkOutController")

const orderController = require('../controllers/user/orderController')

const wishListController = require('../controllers/user/wishListController')

const auth = require('../middlewares/userAuth')

const config = require('../config/config')

const user_rout = express()


user_rout.use(cookieParser())



user_rout.set('views', './views/user');

user_rout.get('/',auth.isLogout,usercontroller.loadHome)

user_rout.get('/register',auth.isLogout,usercontroller.loadRegister)

user_rout.post('/register',usercontroller.registerUser)

user_rout.get('/login',auth.isLogout,usercontroller.lodLogin)

user_rout.post('/reset-password',usercontroller.sendPasswordLink)

user_rout.get('/changePassword',usercontroller.changePassword)

user_rout.post('/changePassword',usercontroller.passwordChanged)

user_rout.post('/login',usercontroller.verifyLogin)

user_rout.get('/verifyOtp',auth.isLogin,usercontroller.loadVerifyOTP)

user_rout.post('/verifyOtp',usercontroller.verifyOTP)

user_rout.post('/resendOtp',usercontroller.resendOtp)

user_rout.get('/home',auth.isLogin,usercontroller.loadUserHome)

user_rout.get('/viewAllProducts',auth.isLogin,usercontroller.loadAllProducts)

user_rout.get('/filterProductsByCategory',auth.isLogin,usercontroller.filterByCategory)

user_rout.get('/viewProduct',auth.isLogin,usercontroller.loadViewProduct)

user_rout.post('/validateCoupon',usercontroller.validateCoupon)

user_rout.get('/getAvailableCoupons',usercontroller.getAvailableCoupons)

//cart management

user_rout.post('/addToCart',cartController.addToCart)

user_rout.get('/viewCart',auth.isLogin,cartController.loadViewCart)

user_rout.post('/updateCart',cartController.updateCart)

user_rout.get('/deleteProduct',auth.isLogin,cartController.deleteProduct)

user_rout.get('/goToCheckout',auth.isLogin,checkOutController.loadCheckout)

//wishList management

user_rout.post('/saveToWishlist',wishListController.addToWishlist)

user_rout.get('/loadWishList',auth.isLogin,wishListController.loadWishList)

//order management 

user_rout.post('/placeOrder',orderController.placeOrder)

user_rout.get('/orderConfirmation',auth.isLogin,orderController.orderConfirmation)

user_rout.post('/verifyPayment',orderController.verifyPayment)

user_rout.get('/viewOrders',auth.isLogin,orderController.viewOrders)

user_rout.post('/cancelOrder',orderController.cancelOrder)

user_rout.get('/orderDetails/:orderId', orderController.getOrderDetails);

user_rout.get('/retryPayment/:orderId',orderController.retryPayment)

//manage profile

user_rout.post('/addNewAddress',profileController.addNewAddress)

user_rout.post('/editAddress',profileController.editAddress)

user_rout.post('/deleteAddress',profileController.deleteAddress)

user_rout.post('/addNewUserAddress',profileController.addNewUserAddress)

user_rout.get('/loadProfile',auth.isLogin,profileController.loadProfile)

user_rout.get('/editProfile',auth.isLogin,profileController.editProfile)

user_rout.post('/editProfile',profileController.updateProfile)

user_rout.post('/changeProfiPassword',profileController.changePassword)

user_rout.get('/loadAddress',auth.isLogin,profileController.loadAddresses)

user_rout.get('/viewWallet',auth.isLogin,profileController.viewWallet)

user_rout.get('/logout',auth.isLogin,usercontroller.userLogout)

module.exports = user_rout