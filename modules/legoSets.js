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
const fs = require('fs');

const setData = require("../data/setData.json");
const themeData = require("../data/themeData.json");

let sets = [];

// initialize sets array with theme names
function initialize() {
    return new Promise((resolve, reject) => { 
      try {
        sets = [];
        setData.forEach(set => {
          const theme = themeData.find(theme => theme.id === set.theme_id)?.name || 'unknown';
          sets.push({
            ...set,
            theme
          });
        });
        resolve(); // resolves with no data
      } catch (error) {
        reject("initializing failed " + error.message);
      }
    });
}

// return all sets
function getAllSets() {
    return new Promise((resolve, reject) => {
      if (sets.length > 0) {
        resolve(sets); // resolves with sets array
      } else {
        reject('no sets found.');
      }
    });
}

// return a specific set by number
function getSetByNum(setNum) {
    return new Promise((resolve, reject) => {
      const matchedSet = sets.find(set => set.set_num === setNum);
      if (matchedSet) {
        resolve(matchedSet);
      } else {
        reject(`set with number ${setNum} not found`);
      }
    });
}

// return sets matching the theme (case insensitive)
function getSetsByTheme(theme) {
    return new Promise((resolve, reject) => {
      const themeSets = sets.filter(set => set.theme.toLowerCase().includes(theme.toLowerCase()));
      if (themeSets.length > 0) {
        resolve(themeSets);
      } else {
        reject(`no sets found for theme: ${theme}`);
      }
    });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme }

