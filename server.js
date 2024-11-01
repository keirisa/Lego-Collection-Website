/********************************************************************************
*  WEB322 – Assignment 04
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Kate de Leon Student ID: 146287230 Date: Oct 31, 2024
*
********************************************************************************/
const express = require('express');
const legoData = require('./modules/legoSets');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// set view engine to ejs
app.set('view engine', 'ejs'); 

// set views dir
app.set('views', `${__dirname}/views`);

// serve static files from public directory
app.use(express.static(`${__dirname}/public`));

// initialize legoData then start server
legoData.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`server is running at http://localhost:${HTTP_PORT}`);
        });
    })
    .catch(err => {
        console.error("failed to initialize lego data:", err);
    });

// home route
app.get('/', (req, res) => {
    res.render("home");
});

// about route
app.get('/about', (req, res) => {
    res.render("about");
});

// route to display all sets or filter by theme
app.get('/lego/sets', (req, res) => {
    const theme = req.query.theme;
    if (theme) {
        legoData.getSetsByTheme(theme)
            .then(data => {
                if (data.length === 0) {
                    res.status(404).render("404", { message: "no sets found for the specified theme." });
                } else {
                    res.render("sets", { sets: data, theme });
                }
            })
            .catch(err => {
                res.status(404).render("404", { message: "an error occurred while fetching the sets by theme." });
            });
    } else {
        legoData.getAllSets()
            .then(data => {
                res.render("sets", { sets: data });
            })
            .catch(err => {
                res.status(500).render("404", { message: "an error occurred while fetching all sets." });
            });
    }
});

// route for individual set pages
app.get('/lego/sets/:set_num', (req, res) => {
    const setNum = req.params.set_num;
    legoData.getSetByNum(setNum)
        .then(data => {
            if (!data) {
                res.status(404).render("404", { message: "set not found." });
            } else {
                res.render("set", { set: data });
            }
        })
        .catch(err => {
            res.status(404).render("404", { message: "an error occurred while fetching the set." });
        });
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).render("404", { message: "i'm sorry, we're unable to find what you're looking for" });
});