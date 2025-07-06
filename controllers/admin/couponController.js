const coupons = require('../../models/couponModel');

const loadCreateCoupon = async (req, res) => {
    try {

        res.render('createCoupon')
    } catch (error) {
        console.log(error.message)
    }
}

const createCoupon = async (req, res) => {
    try {
        const { code, description, discountType, validFrom, validTo } = req.body;
        const codeUppercase = code.toUpperCase();
        const existingCoupon = await coupons.findOne({ code: codeUppercase });

        if (existingCoupon) {
            // Coupon with the same code already exists
            res.render('createCoupon', { message: "Coupon code already exists" });
        } else {
            let discountAmount = 0;
            let discountPercentage = 0;

            if (discountType === "fixed") {
                discountAmount = req.body.discountAmount;
            } else {
                discountPercentage = req.body.discountPercentage;
            }

            const coupon = new coupons({
                code: codeUppercase,
                description,
                discountType,
                discountAmount,
                discountPercentage,
                validFrom,
                validTo
            });

            const couponDetails = await coupon.save();

            res.render('createCoupon', { message: "Coupon added successfully" });
        }
    } catch (error) {
        console.log(error.message)
    }
}
const loadViewCoupon = async (req, res) => {
    try {
        console.log("in load view coupon");
        const allCoupons = await coupons.find({});
        res.render('viewCoupons', { coupons: allCoupons });

    } catch (error) {
        console.log(error.message)
    }
}
const loadEditCoupon = async (req, res) => {
    try {

        const couponId = req.query.id;
        console.log(couponId)
        const couponDetails = await coupons.findOne({ _id: couponId });
        console.log(couponDetails)
        res.render('editCoupon', { coupon: couponDetails })

    } catch (error) {

    }
}
const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.query.id;
        const couponDetails = await coupons.findOne({ _id: couponId });

        if (!couponDetails) {
            console.log("Coupon not found");
            return res.status(404).send("Coupon not found");
        }

        if (couponDetails.isDeleted) {
            console.log("in if");
            couponDetails.isDeleted = false;
        } else {
            console.log("in else");
            couponDetails.isDeleted = true;
        }

        await couponDetails.save(); 

        const allCoupons = await coupons.find({});
        res.render('viewCoupons', { coupons: allCoupons });

    } catch (error) {
        console.log("Error in deleteCoupon:", error.message);
        res.status(500).send("Server Error");
    }
};
const editCoupon = async (req, res) => {
  try {
    const { couponId, validFrom, validTo } = req.body;

    const updated = await coupons.findByIdAndUpdate(couponId, {
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
    });

    const coupon = await coupons.findById(couponId);
    res.render('editCoupon', {
      coupon,
      message: "Coupon updated successfully",
    });
  } catch (err) {
    console.error("Error updating coupon:", err.message);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {
    loadCreateCoupon,
    createCoupon,
    loadViewCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon
}
