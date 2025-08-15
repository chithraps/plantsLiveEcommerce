const product = require("../../models/productModel");
const category = require("../../models/categoryModel");
const upload = require("../../config/multer");
const path = require("path");
const fs = require("fs");

const loadAddProduct = async (req, res) => {
  try {
    const categories = await category.find();

    res.render("addProduct", { categories: categories });
  } catch (error) {
    console.log(error.message);
  }
};

const viewProducts = async (req, res) => {
  try {
    let search = "";
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
          from: "categories", // The name of the "categories" collection
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          name: 1,
          price: 1,
          images: 1,
          stock_count: 1,
          description: 1,
          is_Delelted: 1,
          "category.name": 1,
        },
      },
      {
        $match: {
          $or: [
            { "category.name": { $regex: search + ".*", $options: "i" } },
            { name: { $regex: search + ".*", $options: "i" } },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },

      {
        $skip: skip,
      },
      {
        $limit: perPage,
      },
    ]);
    const totalProducts = await product.countDocuments();
    console.log(totalProducts);
    // Calculate the total number of pages
    const totalPages = Math.ceil(totalProducts / perPage);
    console.log(totalPages);
    //const category = await category.findById({ _id: product.category })
    res.render("viewProducts", {
      products: products,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addProduct = async (req, res) => {
  try {
    const { name, description, price, productCategory, stock } = req.body;
    const images = req.files.map((file) => `/productImages/${file.filename}`);

    const existingProduct = await product.findOne({ name: name });
    const categories = await category.find();
    if (existingProduct) {
      res.render("addProduct", {
        categories: categories,
        message: "Product already exists",
      });
    } else {
      const productData = await new product({
        name,
        description,
        price,
        images,
        category: productCategory,
        stock_count: stock,
      });

      const productStatus = await productData.save();

      if (productStatus) {
        res.render("addProduct", {
          categories: categories,
          message: "Product added successfully",
        });
      } else {
        res.render("addProduct", {
          categories: categories,
          message: "Failed to add product",
        });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const categories = await category.find();
    console.log("in load edit product");
    const productId = req.query.id;
    const productData = await product.findById({ _id: productId });
    res.render("editProduct", { categories: categories, product: productData });
  } catch (error) {
    console.log(error.message);
  }
};

const editProduct = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      price,
      productCategory,
      stock,
      deletedImages,
    } = req.body;
    const stockCount = parseInt(stock);
    const deletedList = deletedImages ? JSON.parse(deletedImages) : [];

    const images = req.files.map((file) => `/productImages/${file.filename}`);
    const currentProductData = await product.findById(id);

    // Filter out deleted images
    const remainingOldImages = currentProductData.images.filter(
      (img) => !deletedList.includes(img)
    );

    // Delete only the removed images from disk
    deletedList.forEach((oldImagePath) => {
      const filePath = path.join(__dirname, "../..", "public", oldImagePath);
      if (fs.existsSync(filePath)) {
        console.log("image is deleted *** ")
        fs.unlinkSync(filePath);
      }
    });

    // New images + old remaining images
    const updatedImages = [...remainingOldImages, ...images];

    const productData = await product.findByIdAndUpdate(id, {
      $set: {
        name,
        description,
        price,
        images: updatedImages,
        category: productCategory,
        stock_count: stockCount,
      },
    });

    if (productData) {
      res.redirect("/admin/viewProducts");
    } else {
      return res.status(404).send("Product is not updated");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const deleteProductImage = async (req, res) => {};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    console.log("in delete product");
    const productData = await product.findById({ _id: productId });
    console.log(productData.is_Delelted);
    if (productData.is_Delelted) {
      const updateProduct = await product.updateOne(
        { _id: productId },
        { $set: { is_Delelted: false } }
      );
    } else {
      const updateProduct = await product.updateOne(
        { _id: productId },
        { $set: { is_Delelted: true } }
      );
    }
    res.render("adminDashboard");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadAddProduct,
  viewProducts,
  addProduct,
  loadEditProduct,
  editProduct,
  deleteProduct,
  deleteProductImage,
};
