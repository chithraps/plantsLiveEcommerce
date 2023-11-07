//DB Connection
const {connectToDatabase} = require('./script');
const express = require("express")
const nocache = require('nocache');
const config = require('./config/config')
const session = require("express-session")
const userRoutes = require("./routes/userRoute")
const adminRoutes = require("./routes/adminRoute")
const path = require('path');

const app = express()
connectToDatabase();

app.use(session({
  secret: config.sesseionSecret,
  resave: false,
  saveUninitialized: true
}))

app.use(express.json())

app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

app.use(nocache());

app.use('/static', express.static(path.join(__dirname, 'public/css')))
app.use(express.static('public'))
app.use('/product-images', express.static('public/product-images'));



app.use('/admin',adminRoutes)
app.use('/', userRoutes)

app.use(function(req,res,next){
  res.status(404).render('404')
})

app.use(function(err, req, res, next){
  console.log(err.stack)
  res.status(500);
  res.render('error');
})

app.listen(process.env.PORT || 3000, () => {
  console.log("server is running ", process.env.PORT)
}) 