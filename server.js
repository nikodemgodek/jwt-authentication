const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = express();
const port = 7000;
const cors = require('cors');
const url = "mongodb+srv://nikodemgodek6:zlo5FhsHmlUn1F20@nikodemdev.1jos7km.mongodb.net/?retryWrites=true&w=majority"
const UserSchema = new mongoose.Schema({ username: String, password: String });
const User = mongoose.model('User', UserSchema);

require('dotenv').config();
const secretKey = process.env.JWT_SECRET_KEY || 'default_secret_key';
console.log('Secret Key:', secretKey);


app.use(cors());
app.use(express.json());

app.post("/login",
    async (req, res, next) => {
        let { username, password } = req.body;
        let existingUser;

        try {
            existingUser = await User.findOne({ username: username })
        } catch (err) {
            const error = new Error("Error! Somethin went wrong");
            return next(error);
        }

        if(!existingUser || existingUser.password != password) {
            const error = new Error('Invalid credentials');
            res
                .status(401)
                .json({
                    success: false,
                    message: 'Invalid credentials'
                })
            return next(error);
        }

        let token;

        try {
            token = jwt.sign(
                {
                    userId: existingUser.id,
                    username: existingUser.username
                },
                secretKey,
                { expiresIn: "1m" }
            );
        } catch (err) {
            console.log(err);
            const error = new Error('Error! Could not generate token');
            return next(error);
        }

        res
            .status(200)
            .json({
                success: true,
                data: {
                    userId: existingUser.id,
                    username: existingUser.username,
                    token: token
                }
            });
    });

app.post('/signup',
    async(req, res, next) => {
        const {
            username,
            password
        } = req.body;
        
        const newUser =
            User({
                username,
                password
            });

        try {
            await newUser.save();
        } catch {
            const error =
                new Error("Error!");
            return next(error);
        }

        let token;

        try {
            token = jwt.sign(
                {
                    userId: newUser.id,
                    username: newUser.username,

                },
                secretKey,
                { expiresIn: "1m" }
            );
        } catch (err) {
            const error =
                new Error("Error!");
            return next(error);
        }

        res
            .status(201)
            .json({
                success: true,
                data: {
                    userId: newUser.id,
                    username: newUser.username,
                    token: token,
                }
            });
    });

    app.post('/verify-token',
        async (req, res) => {
            const { token } = req.body;

            if(!token) {
                return res.status(400).json({ error: 'Token is missing' });
            }

            jwt.verify(token, secretKey, (err, decoded) => {
                if (err) {
                    console.log('Invalid token');
                    return res.status(401).json({ error: 'Invalid token' })
                }

                res.json({ message: 'Token is valid', decoded });
            })
        });

    //database connection
    mongoose
        .connect(url)
        .then( () => {
            app.listen(port,
                () => {
                    console.log('[MongoDB Atlas] Connected...Server listening on port');
                })
        })
        .catch( (err) => {
            console.log('Error occured!');
        })
