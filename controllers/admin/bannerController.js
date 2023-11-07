const banner = require('../../models/bannerModel')

const loadBanner = async (req, res) => {
    try {
        res.render('addBanner')
    } catch (error) {
        console.log(error.message)
    }
}


const addBanner = async (req, res) => {
    try {
        const  title  = req.body.title;
        const link = req.body.link || null;
        const image = req.file.filename;
       
        console.log(title, link, image)
        const newBanner = new banner({ title, image, link });

        const savedBanner = await newBanner.save();
        if (savedBanner) {
            // Redirect to a success page or respond with a success message
            res.render('addBanner', { message: "Banner added successfully!!" })
        } else {
            res.render('addBanner', { message: "Something went wrong" })
        }
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadBanner,
    addBanner
}