const mongoose = require("mongoose");
require("dotenv/config");

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'Plants_Live'
    });
    console.log("Database connection is ready...");
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

module.exports = { connectToDatabase };




