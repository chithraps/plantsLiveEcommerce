const users = require('../../models/userModel')
const products = require('../../models/productModel');
const carts = require('../../models/cartModel')
const wishlists = require('../../models/wishListModel')

const addToWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.session.userData._id;

    const wishlist = await wishlists.findOne({ userId });
    let isExisting = false;
    let isAdded = false;
    if (wishlist) {
      const userWishlist = await wishlists.findOne({ userId: userId, 'products.productId': productId });

      if (userWishlist) {
        isExisting = true;
        console.log('Product already added to wishlist.');
      } else {
        const wishlistItem = { productId };
        wishlist.products.push(wishlistItem);
        await wishlist.save();
        isAdded = true;
        console.log('Product added to wishlist.');
      }
    } else {
      const wishlistItem = { productId };
      const newWishlist = new wishlists({ userId, products: [wishlistItem] });
      await newWishlist.save();
      isAdded = true;
      console.log('Product added to a new wishlist.');
    }
    res.json({ isExisting, isAdded })
  } catch (error) {
    // Handle errors, e.g., duplicate products, database errors
    console.error('Error updating wishlist:', error);
  }
};

const loadWishList = async (req, res) => { 
    try {
       const userId = req.session.userData._id;
        const userWishlist = await wishlists.findOne({ userId }).populate('products.productId');
        
        if (!userWishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }       
        res.render('viewWishList', { wishlist: userWishlist.products });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  
}




module.exports = {
  addToWishlist,
  loadWishList
}