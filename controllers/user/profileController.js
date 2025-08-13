const bcrypt = require("bcrypt");
const users = require("../../models/userModel");
const carts = require("../../models/cartModel");
const wallets = require("../../models/walletModel");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadProfile = async (req, res) => {
  try {
    res.render("profile");
  } catch (error) {
    console.log(error.message);
  }
};

const addNewAddress = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const { fullName, houseName, street, city, state, postalCode } = req.body;
    console.log(fullName, houseName, street, city, state, postalCode);
    const userExists = await users.findOne({ _id: userId });
    await userExists.address.push({
      fullName,
      houseName,
      street,
      city,
      state,
      postalCode,
    });
    const savedUser = userExists.save();
    res.redirect("/goToCheckout");
  } catch (error) {
    console.log(error.message);
  }
};

const editProfile = async (req, res) => {
  try {
    console.log("edit profile");
    const userId = req.session.userData._id;
    const user = await users.findById({ _id: userId });
    if (user) {
      res.render("editProfile", { user });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const { name, mobile } = req.body;
    const updatedUser = await users.findByIdAndUpdate(
      { _id: userId },
      { $set: { name: name, mobile: mobile } }
    );
    console.log(updatedUser);
    res.redirect("/loadProfile");
  } catch (error) {
    console.log(error.messge);
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userData._id;
    const user = await users.findOne({ _id: userId });

    if (user) {
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatch) {
        return res
          .status(400)
          .json({
            error:
              "Password does not match your current password. Please try again.",
          });
      } else {
        const hashedNewPassword = await securePassword(newPassword);

        // Update the user's password with the new hashed password
        const updatedUser = await users.findByIdAndUpdate(
          { _id: userId },
          { $set: { password: hashedNewPassword } }
        );

        res.redirect("/loadProfile");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadAddresses = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const user = await users.findOne({ _id: userId });
    const addresses = user.address;
    res.render("loadAddresses", { addresses });
  } catch (error) {
    console.log(error.message);
  }
};
const addAddress = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const { fullName, houseName, street, city, state, postalCode } = req.body;
    console.log(fullName, houseName, street, city, state, postalCode);
    const userExists = await users.findOne({ _id: userId });
    await userExists.address.push({
      fullName,
      houseName,
      street,
      city,
      state,
      postalCode,
    });
    const savedUser = userExists.save();
    if (savedUser) {
      let totalPrice = 0;
      const userCart = await carts
        .findOne({ userId })
        .populate("items.productId");
      const count = userCart.items.length;
      userCart.items.forEach((item) => {
        totalPrice += item.productId.price * item.quantity;
      });
      const updatedUser = await users.findOne({ _id: userId });
      const addresses = updatedUser.address;
      res.render("loadAddresses", { addresses });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const editAddress = async (req, res) => {
  try {
    const {
      addressIndex,
      fullName,
      houseName,
      street,
      city,
      state,
      postalCode,
    } = req.body;
    const userId = req.session.userData._id;
    if (!req.session.userData.is_Blocked) {
      const user = await users.findById(userId);
      if (!user) {
        return res.json({ message: "User not found", isUpdated: true });
      }
      if (addressIndex < 0 || addressIndex >= user.address.length) {
        res.json({ message: "Invalid Index", isUpdated: false });
      }

      // Update the address at the specified addressIndex
      const addressToUpdate = user.address[addressIndex];
      addressToUpdate.fullName = fullName;
      addressToUpdate.houseName = houseName;
      addressToUpdate.street = street;
      addressToUpdate.city = city;
      addressToUpdate.state = state;
      addressToUpdate.postalCode = postalCode;

      // Save the updated user
      const updatedUser = await user.save();
      if (updatedUser) {
        res.json({ isUpdated: true });
      } else {
        res.json({ isUpdated: false });
      }
    } else {
      req.session.destroy();
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    if (!req.session.userData.is_Blocked) {
      console.log("in delete address");
      const { addressIndex } = req.body;
      console.log(addressIndex);
      const user = await users.findById(userId);

      if (!user) {
        res.json({ isUpdated: false, message: "User not defined" });
      }

      if (addressIndex < 0 || addressIndex >= user.address.length) {
        res.json({ isUpdated: false, message: "Invalid Index" });
      }

      user.address.splice(addressIndex, 1);

      await user.save();

      res.json({ isUpdated: true, message: "Your address has been removed" });
    } else {
      req.session.destroy();
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const addNewUserAddress = async (req, res) => {
  try {
    const userId = req.session.userData._id;
    const { fullName, houseName, street, city, state, postalCode } = req.body;
    console.log(fullName, houseName, street, city, state, postalCode);
    const userExists = await users.findOne({ _id: userId });
    await userExists.address.push({
      fullName,
      houseName,
      street,
      city,
      state,
      postalCode,
    });
    const savedUser = userExists.save();
    if (savedUser) {
      res.json({ isUpdated: true });
    } else {
      res.json({ isUpdated: false });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewWallet = async (req, res) => {
  try {
    const userId = req.session.userData._id;

    let wallet = await wallets.findOne({ userId });

    if (!wallet) {
      wallet = new wallets({
        userId,
        balance: 0,
        transactions: [],
      });
      await wallet.save();
    }
    res.render("myWallet", {
      walletExists: !!wallet, 
      balance: wallet ? wallet.balance : 0,
      transactions: wallet
        ? wallet.transactions.sort((a, b) => b.date - a.date).slice(0, 10)
        : [],
    });
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
  loadProfile,
  addNewAddress,
  editProfile,
  updateProfile,
  changePassword,
  loadAddresses,
  addAddress,
  editAddress,
  deleteAddress,
  addNewUserAddress,
  viewWallet,
};
