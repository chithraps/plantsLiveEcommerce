const users = require("../../models/userModel");
const products = require("../../models/productModel");
const carts = require("../../models/cartModel");
const wishlists = require("../../models/wishListModel");

const addToWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.session.userData._id;

    const wishlist = await wishlists.findOne({ userId });
    let isExisting = false;
    let isAdded = false;
    if (wishlist) {
      const userWishlist = await wishlists.findOne({
        userId: userId,
        "products.productId": productId,
      });

      if (userWishlist) {
        isExisting = true;
        console.log("Product already added to wishlist.");
      } else {
        const wishlistItem = { productId };
        wishlist.products.push(wishlistItem);
        await wishlist.save();
        isAdded = true;
        console.log("Product added to wishlist.");
      }
    } else {
      const wishlistItem = { productId };
      const newWishlist = new wishlists({ userId, products: [wishlistItem] });
      await newWishlist.save();
      isAdded = true;
      console.log("Product added to a new wishlist.");
    }
    res.json({ isExisting, isAdded });
  } catch (error) {
    // Handle errors, e.g., duplicate products, database errors
    console.error("Error updating wishlist:", error);
  }
};

const loadWishList = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const userWishlist = await wishlists
      .findOne({ userId })
      .populate("products.productId");

    if (!userWishlist) {
      res.render('emptyWishList');
    }
    res.render("viewWishList", { wishlist: userWishlist.products });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const removeProduct = async (req, res) => {
  try {
    const userId = req.session.userData._id;

    const productId = req.body.productId;
    console.log(userId, " in remove product ", productId);

    await wishlists.updateOne(
      { userId },
      { $pull: { products: { productId: productId } } }
    );

    res.redirect("/loadWishList");
  } catch (error) {
    console.error("Error deleting product from wishlist:", error);
    res.status(500).send("Internal Server Error");
  }
};
const moveToCart = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const productId = req.query.id;

    console.log(" userId is : ", userId);
    console.log("product id is ", productId);
    await wishlists.updateOne(
      { userId },
      { $pull: { products: { productId: productId } } }
    );

    const updatedCart = await carts.updateOne(
      { userId },
      { $push: { items: { productId, quantity: 1 } } },
      { upsert: true }
    );

    console.log("updated cart ", updatedCart);
    res.redirect("/loadWishList");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  addToWishlist,
  loadWishList,
  removeProduct,
  moveToCart,
};
