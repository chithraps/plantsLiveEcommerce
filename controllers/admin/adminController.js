const multer = require('multer')
const bcrypt = require('bcrypt')
const users = require('../../models/userModel')
const orders = require('../../models/orderModel')
const products = require('../../models/productModel')
const categories = require('../../models/categoryModel')

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash

    } catch (error) {
        console.log(error.message);
    }

}

const loadLogin = async (req, res) => {
    try {

        res.render('login')
    } catch (error) {
        console.log(error.message)
    }
}

const verifyLogin = async (req, res) => {
    try {
        console.log("in verify login");
        const { email, password } = req.body;


        const data = await users.findOne({ email: email })


        if (data) {
            const passwordMatch = await bcrypt.compare(password, data.password);
            if (passwordMatch) {
                req.session.data = data;
                if (data.is_verified && data.is_admin) {
                    res.redirect('/admin/adminHome')
                } else {
                    res.render('login', { message: "Unautherized access" })
                }

            } else {
                res.render('login', { message: "Email or Password deos not exists" })
            }
        } else {
            res.render('login', { message: "Email or Password deos not exists" })
        }


    } catch (error) {
        console.log(error.message)
    }
}

const loadDashboard = async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const monthlyRevenue = await orders.aggregate([
            {
                $match: {
                    status: 'Delivered',
                    createdAt: {
                        $gte: startOfMonth,
                        $lte: endOfMonth,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                },
            },
        ]);
        const totalOrders = await orders.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfMonth,
                        $lte: endOfMonth,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    orderCount: { $sum: 1 },
                },
            },
        ]);
        const monthlySales = await orders.aggregate([
            {
                $match: {
                    status: 'Delivered',
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    total: { $sum: '$totalAmount' },
                },
            },
        ]);

        const salesCount = await orders.aggregate([
            {
                $match: {
                    status: 'Delivered',
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                        },
                    },
                    orderCount: { $sum: 1 },
                },
            },
            {
                $sort: {
                    _id: 1,
                },
            },
        ]);

        const categorySales = await orders.aggregate([
            {
                $match: {
                    status: 'Delivered',
                },
            },
            {
                $unwind: "$items",
            },
            {
                $lookup: {
                    from: 'products', // Use the correct collection name for your products
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'productData',
                },
            },
            {
                $unwind: '$productData',
            },
            {
                $lookup: {
                    from: 'categories', // Use the correct collection name for your categories
                    localField: 'productData.category', // Assuming this is the field in your product schema that references categories
                    foreignField: '_id',
                    as: 'categoryData',
                },
            },
            {
                $unwind: '$categoryData',
            },
            {
                $group: {
                    _id: '$categoryData.name', // Use the correct field in your category model to reference the name
                    totalSales: { $sum: '$items.quantity' },
                },
            },
            {
                $project: {
                    _id: 0, // Exclude the default _id field
                    category: '$_id',
                    totalSales: 1,
                },
            },
            {
                $sort: {
                    totalSales: -1, // Sort in descending order of totalSales
                },
            },
        ]);

        const totalProducts = await products.countDocuments();


        res.render('adminDashboard', { monthlyRevenue, monthlySales: monthlySales, salesCount, totalOrders, totalProducts, categorySales });

    } catch (error) {
        console.log(error.message)
    }
}

const loadUsers = async (req, res) => {
    try {
        console.log('in load users')
        const page = req.query.page || 1;
        const pageSize = 10;
        const skipCount = (page - 1) * pageSize;

        const userData = await users
            .find({ is_admin: false })
            .skip(skipCount)
            .limit(pageSize);
        const totalUsers = await users.countDocuments();
        const totalPages = Math.ceil(totalUsers / pageSize);
        res.render('listUsers', {
            users: userData, currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.log(error.message)
    }
}

const blockOrUnblock = async (req, res) => {
    try {
        const id = req.query.id;
        console.log("in block or unblock")
        const userData = await users.findById({ _id: id });
        if (userData.is_Blocked) {

            const updatedUser = await users.updateOne({ _id: id }, { $set: { is_Blocked: false } })
            const usersData = await users.find({ is_admin: false })
            res.render('listUsers', { users: usersData })
        } else {
            console.log(userData.is_Blocked)
            const updatedUser = await users.updateOne({ _id: id }, { $set: { is_Blocked: true } })
            const usersData = await users.find({ is_admin: false })
            res.render('listUsers', { users: usersData })
        }
    } catch (error) {
        console.log(error.message)
    }
}

const loadRegistration = async (req, res) => {
    try {
        res.render('createUser')
    } catch (error) {
        console.log(error.message)
    }
}

/*const createUser = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;
        const spassword = await securePassword(password);
        const userExits = await users.findOne({ email: email })
        console.log('In create users')
        if (userExits) {
            res.render('createUser', { message: "Email already exists" });
        } else {
            const UserData = new users({
                name: name,
                email: email,
                mobile: mobile,
                password: spassword
            });
            const userStatus = await UserData.save();
            if (userStatus) {
                res.render('createUser', { message: "Your sign up has been successfully completed" });
            } else {
                res.render('createUser', { message: "Your sign up has been failed" });
            }
        }
    } catch (error) {
        console.log(error.message)
    }
}*/

const editUser = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await users.findById({ _id: id });
        if (userData) {
            res.render('editUser', { user: userData })
        } else {
            res.redirect('/admin/adminHome')
        }
    } catch (error) {
        console.log(error.message)
    }
}
const updateUser = async (req, res) => {
    try {
        const { id, name, email, mobile } = req.body;
        const userData = await users.findByIdAndUpdate({ _id: id }, { $set: { name: name, email: email, mobile: mobile } })

        res.redirect('/admin/adminHome')

    } catch (error) {
        console.log(error.message)
    }
}

const deleteUser = async (req, res) => {
    try {
        const id = req.query.id;
        await users.deleteOne({ _id: id })
        res.redirect('/admin/adminHome')
    } catch (error) {
        console.log(error.message)
    }
}
const logoutAdmin = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message)
    }
}

const viewSalesReport = async (req, res) => {
    try {
        const result = await orders.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: '$user',
            },
            {
                $unwind: '$items',
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'productData',
                },
            },
            {
                $unwind: '$productData',
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productData.category',
                    foreignField: '_id',
                    as: 'categoryData',
                },
            },
            {
                $unwind: '$categoryData',
            },
            {
                $project: {
                    _id: 0,
                    username: '$user.name',
                    totalAmount: 1,
                    createdAt: 1,
                    productCategory: '$categoryData.name',
                    productName: '$productData.name',
                    productPrice: '$productData.price',
                    status: 1,
                    // Add more product and category fields as needed
                },
            },
        ]);
        res.render('viewSalesReport' , { result })
    } catch (error) {
        console.log(error.message)
    }
}

const getSalesReport = async (req, res) => {
    try {
        console.log("in get sales report")
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        const status = req.body.statusFilter;
        
        const matchStage = {
            createdAt: { $gte: startDate, $lte: endDate },
        };

        if (status !== 'all') {
            matchStage.status = status;
        }
      
        const result = await orders.aggregate([
            {
                $match: matchStage,
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: '$user',
            },
            {
                $unwind: '$items',
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'productData',
                },
            },
            {
                $unwind: '$productData',
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productData.category',
                    foreignField: '_id',
                    as: 'categoryData',
                },
            },
            {
                $unwind: '$categoryData',
            },
            {
                $project: {
                    _id: 0,
                    username: '$user.name',
                    totalAmount: 1,
                    createdAt: 1,
                    productCategory: '$categoryData.name',
                    productName: '$productData.name',
                    productPrice: '$productData.price',
                    status: 1,
                    // Add more product and category fields as needed
                },
            },
        ]);
        
        res.json({ result });
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    loadUsers,
    blockOrUnblock,
    editUser,
    updateUser,
    deleteUser,
    viewSalesReport,
    getSalesReport,
    loadRegistration,
    logoutAdmin
}