const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const Customer = require("../models/Customer");
const User = require("../models/User");
const {
  createAuthToken,
  getUserPayload,
  requireAuth,
} = require("../middleware/auth");

function normalizeIdentity(value = "") {
  return value.trim().toLowerCase();
}

router.post("/register/customer", async (req, res) => {
  try {
    const { Name, Surname, CI, Email, PhoneNumber, Password } = req.body;

    if (!Name || !Surname || !CI || !Email || !PhoneNumber || !Password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (Password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = normalizeIdentity(Email);
    const normalizedCI = String(CI).trim();

    const existingCI = await Customer.findOne({ CI: normalizedCI });
    if (existingCI && existingCI.Email !== normalizedEmail) {
      return res
        .status(409)
        .json({ error: "There is already an account registered with that CI" });
    }

    const existingUser = await User.findOne({ Email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        error: "There is already an account registered with that email",
      });
    }

    let customer = await Customer.findOne({ Email: normalizedEmail });

    if (!customer) {
      customer = await Customer.create({
        Name,
        Surname,
        CI: normalizedCI,
        Email: normalizedEmail,
        PhoneNumber,
      });
    } else {
      customer.Name = Name;
      customer.Surname = Surname;
      customer.CI = normalizedCI;
      customer.PhoneNumber = PhoneNumber;
      await customer.save();
    }

    const passwordHash = await bcrypt.hash(Password, 10);
    const usernameBase = normalizeIdentity(
      `${Name}.${Surname}`.replace(/\s+/g, ""),
    );

    const user = await User.create({
      Username: usernameBase || normalizedEmail.split("@")[0],
      Email: normalizedEmail,
      PasswordHash: passwordHash,
      Role: "CUSTOMER",
      CustomerID: customer._id,
    });

    const populatedUser = await User.findById(user._id).populate("CustomerID");
    const token = createAuthToken(populatedUser);

    res.status(201).json({
      token,
      user: getUserPayload(populatedUser),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "That email or username is already in use" });
    }
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identity, username, email, password } = req.body;
    const rawIdentity = identity || username || email;

    if (!rawIdentity || !password) {
      return res
        .status(400)
        .json({ error: "Identity and password are required" });
    }

    const normalizedIdentity = normalizeIdentity(rawIdentity);
    const user = await User.findOne({
      $or: [{ Email: normalizedIdentity }, { Username: normalizedIdentity }],
    }).populate("CustomerID");

    if (!user || !user.IsActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createAuthToken(user);

    res.json({
      token,
      user: getUserPayload(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: req.auth,
  });
});

router.patch("/me/profile", requireAuth, async (req, res) => {
  try {
    const { Email, Name, Surname, PhoneNumber } = req.body;
    const normalizedEmail = Email ? normalizeIdentity(Email) : req.user.Email;

    if (normalizedEmail !== req.user.Email) {
      const emailOwner = await User.findOne({
        Email: normalizedEmail,
        _id: { $ne: req.user._id },
      });
      if (emailOwner) {
        return res.status(409).json({ error: "That email is already in use" });
      }
    }

    req.user.Email = normalizedEmail;
    await req.user.save();

    if (req.user.CustomerID) {
      req.user.CustomerID.Email = normalizedEmail;
      if (Name) req.user.CustomerID.Name = Name;
      if (Surname) req.user.CustomerID.Surname = Surname;
      if (PhoneNumber) req.user.CustomerID.PhoneNumber = PhoneNumber;
      await req.user.CustomerID.save();
    }

    const updatedUser = await User.findById(req.user._id).populate(
      "CustomerID",
    );
    res.json({
      user: getUserPayload(updatedUser),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
