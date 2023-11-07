const category = require('../../models/categoryModel');


const loadCategory = async (req, res) => {
    try {
        const categories = await category.find();
        res.render('viewCategory', { categories: categories })
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddCategory = async (req, res) => {
    try {
        res.render('addCategory')
    } catch (error) {
        console.log(error.message)
    }
}

const addCategory = async (req, res) => {
    try {
        console.log("inside addCategory")
        const name = req.body.name.toLowerCase();
        const description = req.body.description.toLowerCase();
        const existingCategory = await category.findOne({ name: name })
        if (existingCategory) {
            res.render('addCategory', { message: "Category already exists" })
        } else {
            const categoryData = new category({
                name: name,
                description: description
            })
            const categorySaved = await categoryData.save();
            if (categorySaved) {
                res.render('addCategory', { message: "Category successfully saved" })
            } else {
                res.ender('addCategory', { message: "Category is not saved" })
            }
        }



    } catch (error) {
        console.log(error.message)
    }
}
const loadeditCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await category.findById({ _id: id })
        if (categoryData) {
            res.render('editCategory', { categoryData: categoryData })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const editCategory = async (req, res) => {
    try {
        const { id, name, description } = req.body;
        const categoryData = await category.findByIdAndUpdate({ _id: id }, { $set: { name: name, description: description } })

        res.redirect('/admin/adminHome')
    } catch (error) {
        console.log(error.message);
    }
}
const deleteCategory = async (req, res) => {
    try {
        const id= req.query.id;
        await category.deleteOne({_id:id})
        res.redirect('/admin/adminHome')
    } catch (error) {
        console.log(error.message)
    }
}
module.exports = {
    loadCategory,
    loadAddCategory,
    addCategory,
    loadeditCategory,
    editCategory,
    deleteCategory
}
