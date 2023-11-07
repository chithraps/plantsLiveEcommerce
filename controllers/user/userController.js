const bcrypt = require("bcrypt")
const users = require("../../models/userModel")
const product = require("../../models/productModel");
const category = require("../../models/categoryModel");
const coupons = require("../../models/couponModel");
const banner = require("../../models/bannerModel");
const nodemailer = require('nodemailer');
const otp_generator = require('otp-generator');
const { isValidObjectId } = require('mongoose');
require("dotenv/config");
// to store email and otp pair
const otpMap = new Map();

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash

  } catch (error) {
    console.log(error.message);
  }

}

function generateNumericOTP(length) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const loadHome = async (req, res) => {
  try {
    let search = '';
    if (req.query.search) {
      search = req.query.search;
    }
    console.log(req.query.search)
    const page = parseInt(req.query.page) || 1; // Current page
    const perPage = 6;

    // Calculate the skip value based on the current page and items per page
    const skip = (page - 1) * perPage;
    const products = await product.aggregate([
      {
        $lookup: {
          from: 'categories', // The name of the "categories" collection
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          name: 1,
          price: 1,
          sizes: 1,
          images: 1,
          stock_count: 1,
          description: 1,
          is_Delelted: 1,
          'category.name': 1,
        },
      },
      {
        $match: {
          is_Delelted: false,
          $or: [
            { 'category.name': { $regex: search + '.*', $options: 'i' } },
            { 'name': { $regex: search + '.*', $options: 'i' } },
          ],
        },
      },

      {
        $skip: skip,
      },
      {
        $limit: perPage,
      },
    ])
    const totalProducts = await product.countDocuments();
    console.log(totalProducts);
    // Calculate the total number of pages
    const totalPages = Math.ceil(totalProducts / perPage);
    console.log(totalPages);
    const banners = await banner.find();
    console.log(banners)

    res.render('userHome', { products: products, currentPage: page, totalPages, banners })

    //res.render('home')
  } catch (error) {
    console.log(error.message)
  }
}

const loadRegister = async (req, res) => {
  try {

    res.render('userRegistration')
  } catch (error) {
    console.log(error.message)
  }

}

const registerUser = async (req, res) => {
  console.log("inside register user")
  try {
    const { name, email, mobile, password } = req.body;
    const spassword = await securePassword(password);
    const userExits = await users.findOne({ email: email })
    console.log(typeof userExits)
    if (userExits) {
      res.render('userRegistration', { message: "Email already exists" });
    } else {
      const UserData = new users({
        name: name,
        email: email,
        mobile: mobile,
        password: spassword
      });
      const userStatus = await UserData.save();

      //generate otp
      const otp = generateNumericOTP(6);
      console.log(otp);
      const otpExpiration = 60 * 1000; // OTP expires in 1 minute
      req.session.otpExpiration = Date.now() + otpExpiration;

      // to store email and otp
      otpMap.set(email, otp);
      console.log(otpMap)

      //creating transporter
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD
        }

      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'OTP Verification',
        text: `Plaese verify your PlanLive account with OTP.Your OTP is: ${otp}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error:', error);
          res.render('userRegistration', { message: "Failed to send OTP." })
        } else {
          console.log('Email sent:', info.response);
          res.render('verifyOTP', { email: email, otpExpiration: req.session.otpExpiration });
        }
      });

      if (!userStatus) {
        res.render('userRegistration', { message: "Your sign up has been failed" });
      }
    }
  } catch (error) {
    console.log(error.message)
  }
}

const resendOtp = async (req, res) => {
  try {
    const email = req.body.email;
    console.log("resend otp")
    const otp = generateNumericOTP(6);
    console.log(otp);
    const otpExpiration = 60 * 1000; // OTP expires in 1 minute
    req.session.otpExpiration = Date.now() + otpExpiration;

    // to store email and otp
    otpMap.set(email, otp);
    console.log(otpMap)

    //creating transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }

    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'OTP Verification',
      text: `Plaese verify your PlanLive account with OTP.Your OTP is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error:', error);
        res.render('verifyOTP', { message: "Failed to send OTP. Please resend otp" })
      } else {
        console.log('Email sent:', info.response);
        res.render('verifyOTP', { email: email, otpExpiration: req.session.otpExpiration });
      }
    });
  } catch (error) {
    console.log(error.message)
  }
}

const lodLogin = async (req, res) => {
  try {
    res.render('userLogin')
  } catch (error) {
    console.log(error.message)
  }
}



const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await users.findOne({ email: email })

    if (userData) {
      if (!userData.is_Blocked) {
        const passwordMatch = await bcrypt.compare(password, userData.password)
        console.log(userData.is_verified);
        if (passwordMatch) {
          req.session.userData = userData;
          if (!userData.is_verified) {
            console.log("email is not verified")
          } else {
            console.log("varified")
            res.redirect('/home')
          }
        } else {
          res.render('userLogin', { message: "Email or password is incorrect" })
        }
      } else {
        res.render('userLogin', { message: "Your account has been blocked" })
      }
    } else {
      res.render('userLogin', { message: "Email or password is incorrect" })
    }



  } catch (error) {
    console.log(error.message)
  }
}

const sendPasswordLink = async (req, res) => {
  try {
    const email = req.body.rEmail;
    const user = await users.findOne({ email: email });

    if (user) {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD
        }

      });
      const mailOptions = {
        from: 'your-email@gmail.com',
        to: user.email,
        subject: 'Password Reset',
        html: `
        <p>You are receiving this email because you requested a password reset for your account.</p>
        <p>Please click this <a href="http://localhost:3000/changePassword">link</a> to reset your password.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error:', error);

        } else {

          res.render('userLogin', { message: "Link will be sent to your email" })
        }
      });
    } else {
      res.render('userLogin', { message: "Email does not exists" })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const changePassword = async (req, res) => {
  try {
    res.render('forgotPassword')
  } catch (error) {
    console.log(error.messge)
  }
}

const passwordChanged = async (req, res) => {
  try {
    const { email, password } = req.body;
    const spassword = await securePassword(password);
    const userExits = await users.findOne({ email: email })
    if (userExits) {
      const updatedPassword = await users.updateOne({ email: email }, { $set: { password: spassword } })
      if (updatedPassword) {
        console.log(updatedPassword)
        res.render('forgotPassword', { message: "Password updated successfully" })
      } else {
        res.render('forgotPassword', { message: "Error happened please try again" })
      }
    }

  } catch (error) {
    console.log(error.message)
  }
}

const loadVerifyOTP = async (req, res) => {
  try {
    res.render('verifyOTP')
  } catch (error) {
    console.log(error.message)
  }
}

const verifyOTP = async (req, res) => {
  try {
    const { email, otp, otpExpiration } = req.body;
    console.log("in verify otp ", otpMap, " ", otp, " ", otpMap.has(email), " ", otpMap.get(email))
    const currentTime = Date.now();
    const difference = currentTime - otpExpiration;
    const oneMinuteInMilliseconds = 60 * 1000
    if (difference < oneMinuteInMilliseconds) {
      if (otpMap.has(email) && otpMap.get(email) == otp) {
        const verified = await users.updateOne({ email: email }, { $set: { is_verified: true } });
        console.log("verified")
        res.redirect('/')
      } else {
        console.log("failed")
        res.render('verifyOTP', { message: "OTP is incorrect", email: email })
      }
    } else {
      res.render('verifyOTP', { message: "OTP has been expired.please resend otp", email: email, otpExpiration: otpExpiration })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadUserHome = async (req, res) => {
  try {
    const userData = req.session.userData;
    let search = '';
    if (req.query.search) {
      search = req.query.search;
    }

    const page = parseInt(req.query.page) || 1; // Current page
    const perPage = 6;

    // Calculate the skip value based on the current page and items per page
    const skip = (page - 1) * perPage;
    const products = await product.aggregate([
      {
        $lookup: {
          from: 'categories', // The name of the "categories" collection
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          name: 1,
          price: 1,
          sizes: 1,
          images: 1,
          stock_count: 1,
          description: 1,
          is_Delelted: 1,
          'category.name': 1,
        },
      },
      {
        $match: {
          is_Delelted: false,
          $or: [
            { 'category.name': { $regex: search + '.*' } },
            { 'name': { $regex: search + '.*' } },
          ],
        },
      },

      {
        $skip: skip,
      },
      {
        $limit: perPage,
      },
    ])
    const totalProducts = await product.countDocuments();
    console.log(totalProducts);
    // Calculate the total number of pages
    const totalPages = Math.ceil(totalProducts / perPage);
    console.log(totalPages);
    //const category = await category.findById({ _id: product.category })
    const banners = await banner.find();
    res.render('userHome', { products: products, currentPage: page, totalPages, userData, banners })
  } catch (error) {
    console.log(error.messsage)
  }
}

const userLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect('/')
  } catch (error) {
    console.log(error.message)
  }
}
const loadAllProducts = async (req, res) => {
  try {
    const user = req.session.userData
    if (!user.is_Blocked) {
      const categories = await category.find();
      let search = '';
      if (req.query.search) {
        search = req.query.search;

      }

      const page = parseInt(req.query.page) || 1; // Current page
      const perPage = 9;
      const filter = {
        $or: [
          { 'category.name': { $regex: search + '.*', $options: 'i' } },
          { 'name': { $regex: search + '.*', $options: 'i' } },
        ]
      };


      // Calculate the skip value based on the current page and items per page
      const skip = (page - 1) * perPage;
      const products = await product.aggregate([
        {
          $lookup: {
            from: 'categories', // The name of the "categories" collection
            localField: 'category',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: '$category',
        },
        {
          $project: {
            name: 1,
            price: 1,
            images: 1,
            stock_count: 1,
            description: 1,
            is_Delelted: 1,
            'category.name': 1,
          },
        },
        {
          $match: filter, // Apply the filter based on search and category
        },
        {
          $skip: skip,
        },
        {
          $limit: perPage,
        },
      ]);

      const totalProducts = await product.countDocuments(filter); // Count total matching products
      const totalPages = Math.ceil(totalProducts / perPage);

      res.render('allProducts', { categories, products: products, currentPage: page, totalPages});
    } else {
      req.session.destroy();
      res.redirect('/');
    }
  } catch (error) {
    console.log(error.message);
  }
};
const filterByCategory = async (req, res) => {
  try {
    console.log("hello we are in filter by category")
    const user = req.session.userData;
    if (!user.is_Blocked) {
      const categoryIds = req.query.categoryIds.split(',').map(id => id.trim());
      const page = parseInt(req.query.page) || 1; // Current page, default to 1
      const perPage = parseInt(req.query.perPage) || 9;
      const skip = (page - 1) * perPage;
      const filteredProducts = await product.find({ category: { $in: categoryIds } }).skip(skip)
        .limit(perPage);
      const totalProducts = await product.find({ category: { $in: categoryIds } }).countDocuments();
      console.log(totalProducts)
      // Calculate the total number of pages
      const totalPages = Math.ceil(totalProducts / perPage);
      console.log(totalPages)
      res.status(200).json({ filteredProducts, currentPage: page, totalPages });
    } else {
      req.session.destroy()
      res.redirect('/')
    }
  } catch (error) {
    console.log(error.message)
  }
}
const loadViewProduct = async (req, res) => {
  try {
    const user = req.session.userData;
    if (!user.is_Blocked) {

      const productId = req.query.id
      if (!isValidObjectId(productId)) {
        console.log("not valid id")
        return res.status(404).render('404');
      }
      const productData = await product.findById(productId)
        .populate('category', 'name');
      if (productData) {
        const currentDate = new Date();
        const offer = productData.offer;

        if (offer && offer.startDate <= currentDate && offer.endDate >= currentDate) {
          const discountPercentage = offer.discountPercentage;
          const originalPrice = productData.price;
          const discountedPrice = parseInt(originalPrice - (originalPrice * discountPercentage / 100));
          res.render('productView', {
            product: productData,
            discountedPrice: discountedPrice,
            originalPrice: originalPrice
          });
        } else {
          // No valid offer, display the product with its original price
          res.render('productView', { product: productData });
        }
      } else {
        return res.status(404).render('404');
      }
    } else {
      req.session.destroy();
      res.redirect('/');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('error');
  }
};
const validateCoupon = async (req, res) => {
  try {
    const userId = req.session.userData._id
    const user = await users.findById({ _id: userId })
    if (!user.is_Blocked) {
      const { couponCode, totalPrice } = req.body;

      let discountAmount = 0;

      const code = couponCode.toUpperCase()
      const coupon = await coupons.findOne({ code });

      if (!coupon) {
        console.log("invalid coupon code")
        return res.json({ isValid: false, message: 'Invalid coupon code.' });
      }
      const currentDate = new Date();
      if (currentDate < coupon.validFrom || currentDate > coupon.validTo) {
        console.log("coupon expired")
        return res.json({ isValid: false, message: 'Coupon has expired.' });
      }
      if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
        console.log("coupon has reached max users")
        return res.json({ isValid: false, message: 'Coupon has reached its maximum usage limit.' });
      }
      if (coupon.usedBy.includes(userId)) {
        return res.json({ isValid: false, message: 'You have already applied this coupon.' });
      }
      if (totalPrice < 1000) {
        return res.json({ isValid: false, message: 'For orders over 1000, enjoy special benefits!' });
      }
      if (coupon.discountType === 'fixed') {
        console.log("fixed")
        console.log(coupon.discountAmount)
        discountAmount = coupon.discountAmount;

      } else if (coupon.discountType === 'percentage') {
        console.log("percentage")
        discountAmount = parseInt((totalPrice * coupon.discountPercentage) / 100);
      }
      if (discountAmount > coupon.maximumDiscount) {
        discountAmount = coupon.maximumDiscount;
      }

      const newTotalPrice = totalPrice - discountAmount;
      console.log(totalPrice, discountAmount, newTotalPrice)
      const couponInfo = {
        code: coupon,
        discountAmount: discountAmount,
    };
      req.session[userId] = couponInfo;
      const couponCodeSession = req.session[userId];
      //console.log(couponCodeSession.code);

      res.json({ isValid: true, message: 'Coupon is valid.', discountAmount, newTotalPrice });
    } else {
      req.session.destroy()
      res.redirect('/')
    }
  } catch (error) {
    console.log(error.messge)
  }
}

const getAvailableCoupons = async (req, res) => {
  try {
    console.log("in getAvailable coupons")
    const currentDate = new Date();
    const activeCoupons = await coupons.find({
      validFrom: { $lte: currentDate },
      validTo: { $gte: currentDate },
      isDeleted: false, // Assuming 'isDeleted' field indicates active coupons
    });
    console.log(activeCoupons)
    // Send the active coupons as a JSON response
    res.json({ coupons: activeCoupons });

  } catch (error) {
    console.log(error.message)
  }
}


module.exports = {
  loadHome,
  loadRegister,
  registerUser,
  lodLogin,
  verifyLogin,
  sendPasswordLink,
  changePassword,
  passwordChanged,
  loadVerifyOTP,
  verifyOTP,
  resendOtp,
  loadUserHome,
  userLogout,
  loadAllProducts,
  filterByCategory,
  loadViewProduct,
  validateCoupon,
  getAvailableCoupons
}