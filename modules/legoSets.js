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
const fs = require('fs');

require('dotenv').config();
const Sequelize = require('sequelize');

// create instance with SSL configuration
let sequelize = new Sequelize({
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true, 
      rejectUnauthorized: false 
    }
  }
});

// defining models
const Theme = sequelize.define('Theme', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: Sequelize.STRING,
}, { timestamps: false });

const Set = sequelize.define('Set', {
  set_num: { type: Sequelize.STRING, primaryKey: true },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  img_url: Sequelize.STRING,
}, { timestamps: false });

Set.belongsTo(Theme, { foreignKey: 'theme_id' });

// initialize sets from the database
async function initialize() {
    try {
        await sequelize.sync();
        console.log("Database initialized successfully.");
    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

// get all sets
function getAllSets() {
    return Set.findAll({ include: [Theme] })
        .then(sets => sets.map(set => ({
            set_num: set.set_num,
            name: set.name,
            year: set.year,
            num_parts: set.num_parts,
            theme: set.Theme ? set.Theme.name : 'unknown',
            img_url: set.img_url
        })));
}

// get a set by number
function getSetByNum(setNum) {
    return Set.findOne({ where: { set_num: setNum }, include: [Theme] })
        .then(set => {
            if (set) {
                return {
                    set_num: set.set_num,
                    name: set.name,
                    year: set.year,
                    num_parts: set.num_parts,
                    theme_id: set.theme_id,
                    theme: set.Theme ? set.Theme.name : 'unknown',
                    img_url: set.img_url
                };
            }
            throw new Error("Unable to find requested set");
        });
}

// get sets by theme
function getSetsByTheme(theme) {
    return Set.findAll({
        include: [Theme],
        where: {
            '$Theme.name$': {
                [Sequelize.Op.iLike]: `%${theme}%`
            }
        }
    }).then(fetchedSets => {
        if (fetchedSets.length > 0) {
            return fetchedSets.map(set => ({
                set_num: set.set_num,
                name: set.name,
                year: set.year,
                num_parts: set.num_parts,
                theme: set.Theme.name,
                img_url: set.img_url
            }));
        }
        throw new Error("Unable to find requested sets");
    });
}

// add a new set
function addSet(setData) {
    return Set.create({
        set_num: setData.set_num,
        name: setData.name,
        year: setData.year,
        num_parts: setData.num_parts,
        theme_id: setData.theme_id,
        img_url: setData.img_url
    })
    .then(() => Promise.resolve())
    .catch(err => Promise.reject(new Error(err.errors[0].message)));
}

// get all themes
function getAllThemes() {
    return Theme.findAll()
        .then(themes => themes.map(theme => ({
            id: theme.id,
            name: theme.name
        })));
}

// edit an existing set
function editSet(set_num, setData) {
    return Set.update({
        name: setData.name,
        year: setData.year,
        num_parts: setData.num_parts,
        theme_id: setData.theme_id,
        img_url: setData.img_url
    }, {
        where: { set_num: set_num }
    })
    .then(() => Promise.resolve())
    .catch(err => Promise.reject(new Error(err.errors[0].message)));
}

// delete a set
function deleteSet(set_num) {
    return Set.destroy({
        where: { set_num }
    })
    .then(() => Promise.resolve())
    .catch(err => Promise.reject(new Error(err.errors[0].message)));
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, editSet, deleteSet, getAllThemes };
