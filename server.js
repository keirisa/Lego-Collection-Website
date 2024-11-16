/********************************************************************************
*  WEB322 – Assignment 05
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Kate de Leon Student ID: 146287230 Date: Nov 14, 2024
*
********************************************************************************/
require('dotenv').config(); // load environment variables from .env file
require('pg');
const express = require('express');
const legoData = require('./modules/legoSets');
const app = express();
const HTTP_PORT = process.env.PORT || 8080; // define the http port using environment variables or default to 8080
const Sequelize = require('sequelize');

app.use(express.urlencoded({ extended: true }));

// set view engine to ejs
app.set('view engine', 'ejs');

// set views directory
app.set('views', `${__dirname}/views`);

// serve static files from public directory
app.use(express.static(`${__dirname}/public`));
app.use(express.urlencoded({ extended: true })); // parse form data

// initialize legodata then start server
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
                res.status(500).render("500", { message: `error fetching sets by theme: ${err.message}` });
            });
    } else {
        legoData.getAllSets()
            .then(data => {
                res.render("sets", { sets: data });
            })
            .catch(err => {
                res.status(500).render("500", { message: `error fetching all sets: ${err.message}` });
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
            res.status(500).render("500", { message: `error fetching set: ${err.message}` });
        });
});

// add set route
app.get('/lego/addSet', (req, res) => {
    legoData.getAllThemes()
        .then(themes => res.render("addSet", { themes }))
        .catch(err => res.status(500).render("500", { message: `error loading themes: ${err.message}` }));
});

// handle form submission for adding a new set
app.post('/lego/addSet', (req, res) => {
    legoData.addSet(req.body)
        .then(() => res.redirect("/lego/sets"))
        .catch(err => res.status(500).render("500", { message: `error adding set: ${err.message}` }));
});

// edit set route
app.get('/lego/editSet/:num', (req, res) => {
    const setNum = req.params.num;
    Promise.all([legoData.getSetByNum(setNum), legoData.getAllThemes()])
        .then(([set, themes]) => {
            if (!set) {
                res.status(404).render("404", { message: "set not found." });
            } else {
                res.render("editSet", { set, themes });
            }
        })
        .catch(err => res.status(500).render("500", { message: `error loading set or themes: ${err.message}` }));
});

// handle form submission for editing a set
app.post('/lego/editSet', (req, res) => {
    legoData.editSet(req.body.set_num, req.body)
        .then(() => res.redirect("/lego/sets"))
        .catch(err => res.status(500).render("500", { message: `error editing set: ${err.message}` }));
});

// delete set route
app.get('/lego/deleteSet/:num', (req, res) => {
    const setNum = req.params.num;
    legoData.deleteSet(setNum)
        .then(() => res.redirect("/lego/sets"))
        .catch(err => res.status(500).render("500", { message: `error deleting set: ${err.message}` }));
});

// 404 route (catch-all for undefined routes)
app.use((req, res) => {
    res.status(404).render("404", { message: "page not found." });
});

module.exports = app;
