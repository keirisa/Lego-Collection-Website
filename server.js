/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Kate de Leon Student ID: 146287230 Date: Nov 30, 2024
********************************************************************************/

const express = require('express');
const legoData = require('./modules/legoSets');
const authData = require('./modules/auth-service');
const clientSessions = require('client-sessions');

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware
app.set('view engine', 'ejs'); 
app.set('views', `${__dirname}/views`); 
app.use(express.static(`${__dirname}/public`)); 
app.use(express.urlencoded({ extended: true })); 

// Configure session middleware
app.use(clientSessions({
    cookieName: 'session',
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', 
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5, 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    ephemeral: true
}));

// Make session available in templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Middleware to ensure user login
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// Initialize legoData and authData, then start the server
legoData.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Server running at http://localhost:${HTTP_PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to initialize:", err);
    });

// Routes
app.get('/', (req, res) => res.render("home", { user: req.session.user }));
app.get('/about', (req, res) => res.render("about", { user: req.session.user }));

// Display all Lego sets or filter by theme
app.get('/lego/sets', (req, res) => {
    const theme = req.query.theme;
    const fetchSets = theme ? legoData.getSetsByTheme(theme) : legoData.getAllSets();

    fetchSets
        .then(data => {
            if (!data || data.length === 0) {
                return res.status(404).render("404", { message: "No sets found for the specified theme.", user: req.session.user });
            }
            res.render("sets", { sets: data, theme, user: req.session.user });
        })
        .catch(err => res.status(500).render("500", { message: `Error fetching sets: ${err.message}`, user: req.session.user }));
});

// View set details
app.get('/lego/sets/:set_num', (req, res) => {
    const setNum = req.params.set_num;
    legoData.getSetByNum(setNum)
        .then(set => {
            if (!set) {
                return res.status(404).render("404", { message: "Set not found.", user: req.session.user });
            }
            res.render("set", { set, user: req.session.user });
        })
        .catch(err => res.status(500).render("500", { message: `Error fetching set details: ${err.message}`, user: req.session.user }));
});

// Add set
app.get('/lego/addSet', ensureLogin, (req, res) => {
    legoData.getAllThemes()
        .then(themes => res.render("addSet", { themes, user: req.session.user }))
        .catch(err => res.status(500).render("500", { message: `Error loading themes: ${err.message}`, user: req.session.user }));
});

app.post('/lego/addSet', ensureLogin, (req, res) => {
    legoData.addSet(req.body)
        .then(() => res.redirect("/lego/sets"))
        .catch(err => res.status(500).render("500", { message: `Error adding set: ${err.message}`, user: req.session.user }));
});

// Edit set
app.get('/lego/editSet/:num', ensureLogin, (req, res) => {
    const setNum = req.params.num;
    Promise.all([legoData.getSetByNum(setNum), legoData.getAllThemes()])
        .then(([set, themes]) => {
            if (!set) {
                return res.status(404).render("404", { message: "Set not found.", user: req.session.user });
            }
            res.render("editSet", { set, themes, user: req.session.user });
        })
        .catch(err => res.status(500).render("500", { message: `Error loading set or themes: ${err.message}`, user: req.session.user }));
});

app.post('/lego/editSet', ensureLogin, (req, res) => {
    legoData.editSet(req.body.set_num, req.body)
        .then(() => res.redirect("/lego/sets"))
        .catch(err => res.status(500).render("500", { message: `Error editing set: ${err.message}`, user: req.session.user }));
});

// Delete set
app.get('/lego/deleteSet/:num', ensureLogin, (req, res) => {
    legoData.deleteSet(req.params.num)
        .then(() => res.redirect("/lego/sets"))
        .catch(err => res.status(500).render("500", { message: `Error deleting set: ${err.message}`, user: req.session.user }));
});

// Login
app.get('/login', (req, res) => {
    res.render('login', { errorMessage: '', userName: '', user: req.session.user });
});

app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then(user => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory,
            };
            res.redirect('/lego/sets');
        })
        .catch(err => {
            res.render('login', { errorMessage: err, userName: req.body.userName, user: req.session.user });
        });
});

// Register
app.get('/register', (req, res) => res.render('register', { successMessage: '', errorMessage: '', userName: '', user: req.session.user }));

app.post('/register', (req, res) => {
    console.log("Received POST /register with data:", req.body); // Debug log
    authData.registerUser(req.body)
        .then(() => {
            console.log("User registered successfully");
            res.render('register', {
                successMessage: "User created successfully",
                errorMessage: '',
                userName: ''
            });
        })
        .catch(err => {
            console.log("Error during registration:", err); // Debug log
            res.render('register', {
                successMessage: '',
                errorMessage: err,
                userName: req.body.userName
            });
        });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

// User History
app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory', { loginHistory: req.session.user.loginHistory, user: req.session.user });
});

// 404 for undefined routes
app.use((req, res) => res.status(404).render("404", { message: "Page not found.", user: req.session.user }));

module.exports = app;
