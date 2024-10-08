const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Message = require('../models/Message');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;

/**
 * 
 * Check Login
 */
const authMiddleware = (req, res, next ) => {
    const token = req.cookies.token;

    if(!token) {
        return res.status(401).json( { message: 'Unauthorized'} );
    }
     
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch(error) {
        res.status(401).json( { message: 'Unauthorized' } );
    }
}










/**
 * GET /
 * Admin - Login Page
 */


router.get('/admin', async (req, res) => {
    try {
        const locals = {
            title: "Admin",
            description: "Simple Blog created with NodeJs, Express & MongoDb."
        }

        res.render('admin/index', { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
    
});

/**
 * POST /
 * Admin - Check Login
 */

router.post('/admin', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne( { username } );

        if(!user) {
            return res.status(401).json( { message: 'Invalid credentials' } );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(401).json( { message: 'Invalid credentials' } );
        }

        const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, jwtSecret )
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/dashboard');

    } catch (error) {
        console.log(error);
    }
    
});


/**
 * GET /
 * Admin Dashboard
 */

router.get('/dashboard', authMiddleware, async (req, res) => {

    try {
        const locals = {
            title: 'Dashboard',
            description: 'Simple Blog created with NodeJs, Express & MongoDb.'
        }
        const data = await Post.find();
        res.render('admin/dashboard', {
            locals,
            data,
            layout: adminLayout
        });
    } catch(error) {
        console.log(error);
    }

});


/**
 * GET /
 * Admin - Create New Post
 */

router.get('/add-post', authMiddleware, async (req, res) => {

    try {
        const locals = {
            title: 'Add Post',
            description: 'Simple Blog created with NodeJs, Express & MongoDb.'
        }
        const data = await Post.find();
        res.render('admin/add-post', {
            locals,
            layout: adminLayout
        });
    } catch(error) {
        console.log(error);
    }

});


/**
 * POST /
 * Admin - Create New Post
 */
router.post('/add-post', authMiddleware, async (req, res) => {

    try {
        try {
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body
            });

            await Post.create(newPost);
            res.redirect('/dashboard');
        } catch (error) {
            console.log(error);   
        }

    } catch(error) {
        console.log(error);
    }

});



/**
 * GET /
 * Admin - Create New Post
 */
router.get('/edit-post/:id', authMiddleware, async (req, res) => {

    try {

        const locals = {
            title: 'Edit Post',
            description: 'SFree NodeJs User Management System'
        };

        const data = await Post.findOne({ _id: req.params.id });

        res.render('admin/edit-post', {
            locals,
            data,
            layout: adminLayout
        })


    } catch(error) {
        console.log(error);
    }

});


/**
 * PUT /
 * Admin - Create New Post
 */
router.post('/edit-post/:id', authMiddleware, async (req, res) => {

    try {

        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });

        res.redirect(`/edit-post/${req.params.id}`)


    } catch(error) {
        console.log(error);
    }

});




// router.post('/admin', async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         if(req.body.username === 'admin' && req.body.password === 'password') {
//             res.send('You are logged in.');
//         } else {
//             res.send('Wrong username or password');
//         }

//     } catch (error) {
//         console.log(error);
//     }
    
// });

/**
 * POST /
 * Admin - Register
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({ username, password: hashedPassword } );
            res.status(201).json({ message: 'User Created', user });
        } catch (error) {
            if(error.code === 11000) {
                res.status(409).json({ message: 'User already in use'});
            }
            res.status(500).json({ message: 'Internal server error' });
        }

    } catch (error) {
        console.log(error);
    }
    
});


/**
 * DELETE /
 * Admin - Delete Post
 */
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne( { _id: req.params.id } );
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }
});

/**
 * GET /
 * Admin - Logout
 */
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    //res.json({ message: 'Logout successful.'});
    res.redirect('/');
});

//GET
//Admin - Contact

// router.post('/contact', (req, res) => {
//     const { name, email, message } = req.body;

//     // Here, you could add functionality to send the data to an email, save it to a database, etc.
//     console.log(`Message received from ${name} (${email}): ${message}`);

//     res.send('Thank you for your message!'); // You can render a thank-you page or redirect back to /contact
// });

router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        const newMessage = new Message({ name, email, message });
        await newMessage.save(); // Save message to the database

        console.log(`Message received from ${name} (${email}): ${message}`);
        res.send('Thank you for your message!'); // Optionally, redirect or render a thank-you page

    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).send('Server error');
    }
});


router.get('/admin/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 }); // Fetch messages from DB
        res.render('admin-messages', { messages }); // Render the messages in a view
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).send('Server error');
    }
});







module.exports = router;