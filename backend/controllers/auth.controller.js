const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!password) {
            return res
                .status(400)
                .json({ status: 'error', error: 'Password is required for standard registration' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res
                .status(400)
                .json({ status: 'error', error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        const token = jwt.sign(
            {
                id: newUser._id,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            status: 'success',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error('Error during user registration:', error.message);
        res.status(500).json({ status: 'error', error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const loginId = username || email;

        const user = await User.findOne({
            $or: [
                { username: loginId },
                { email: loginId }
            ]
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const tokenPayload = {
            id: user._id,
        };

        if (user.role === "Admin") {
            tokenPayload.role = "Admin";
        }

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });


        res.status(200).json({ token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Server error" });
    }
};


exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub, email, name } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                username: name,
                email,
                password: null,
            });
            await user.save();
        }

        const jwtToken = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            status: "success",
            token: jwtToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Error during Google login:", error.message);
        res.status(500).json({ error: "Server error" });
    }
};

exports.logoutUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        await User.findByIdAndUpdate(decoded.id, { lastLoggedOutAt: new Date() });

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error during logout:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

