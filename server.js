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
const express = require("express");
const app = express();
const path = require("path");
const HTTP_PORT = process.env.PORT || 8080;
const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");

app.use(
  clientSessions({
    cookieName: "session",
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  console.log(res.locals.session);
  next();
});

app.set("view engine", "ejs");

app.set("views", __dirname + "/views");

app.use(express.static(__dirname + "/public"));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/login", (req, res) => 
  {
    res.render("login", { userName: null, errorMessage: null });
  });

  app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");
  
    authData
      .checkUser(req.body)
      .then((user) => {
        req.session.user = {
          userName: user.userName,
          email: user.email,
          loginHistory: user.loginHistory,
        };
        res.redirect("/lego/sets");
      })
      .catch((err) => {
        res.render("login", {
          errorMessage: err,
          userName: req.body.userName,
        });
      });
  });

  app.get("/register", (req, res) => {
    res.render("register", {
      successMessage: null,
      errorMessage: null,
      userName: null,
      email:null
    });
  });
  
  app.post("/register", (req, res) => {
    const userData = {
      userName: req.body.userName,
      password: req.body.password,
      password2: req.body.password2,
      email: req.body.email,
      userAgent: req.headers["user-agent"],
    };
  
    authData
      .registerUser(userData)
      .then(() => {
        res.render("register", {
          successMessage: "User created",
          errorMessage: null,
          userName: null,
        });
      })
      .catch((err) => {
        res.render("register", {
          successMessage: null,
          errorMessage: err,
          userName: req.body.userName,
        });
      });
  });

  app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
  });
  
  app.get("/userHistory", ensureLogin, (req, res) => {
    console.log(req.session.user);
    res.render("userHistory");
  });
  
app.get("/lego/sets", (req, res) => {
  const { theme } = req.query;

  if (theme) {
    legoData
      .getSetsByTheme(theme)
      .then((setsByTheme) => {
        if (setsByTheme.length > 0) {
          res.render("sets", { sets: setsByTheme });
        } else {
          res
            .status(404)
            .render("404", { message: `No sets found for theme: ${theme}` });
        }
      })
      .catch((error) => {
        console.log("Error retrieving sets by theme:", error);
        res.status(500).render("500", {
          message: "An error occurred while retrieving the Lego sets.",
        });
      });
  } else {
    legoData
      .getAllSets()
      .then((allSets) => {
        if (allSets.length > 0) {
          res.render("sets", { sets: allSets });
        } else {
          res.status(404).render("404", { message: "No Lego sets found." });
        }
      })
      .catch((error) => {
        console.log("Error retrieving all sets:", error);
        res.status(500).render("500", {
          message: "Error occured",
        });
      });
  }
});

app.get("/lego/sets/:set_num", (req, res) => {
  let { set_num } = req.params;

  legoData
    .getSetByNum(set_num)
    .then((set) => {
      if (set) {
        res.render("set", { set: set });
      } else {
        res.status(404).render("404", {
          message: `No set found with set number: ${set_num}`,
        });
      }
    })
    .catch((error) => {
      console.log("Error retrieving set by number:", error);
      res.status(500).render("500", {
        message: "An error occurred while retrieving the Lego set.",
      });
    });
});

app.get("/lego/addSet", ensureLogin, (req, res) => {
  legoData
    .getAllThemes()
    .then((themeData) => {
      res.render("addSet", { themes: themeData });
    })
    .catch((err) => {
      res.render("500", { message: `ERROR ${err}` });
    });
});

app.post("/lego/addSet", ensureLogin, (req, res) => {
  const setData = req.body;
  legoData
    .addSet(setData)
    .then(() => {
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("500", { message: `ERROR ${err}` });
    });
});

app.get("/lego/editSet/:num", ensureLogin, (req, res) => {
  legoData
    .getSetByNum(req.params.num)
    .then((set) => {
      if (!set) {
        res.status(404).render("404", {
          message: `Set with number ${req.params.num} not found`,
        });
      } else {
        legoData
          .getAllThemes()
          .then((themes) => {
            res.render("editSet", { set: set, themes: themes });
          })
          .catch((err) => {
            res.status(404).render("404", {
              message: `Error when trying to get themes: ${err}`,
            });
          });
      }
    })
    .catch((err) => {
      res
        .status(404)
        .render("404", { message: `Error when trying to get set: ${err}` });
    });
});

app.post("/lego/editSet", ensureLogin, (req, res) => {
  legoData
    .editSet(req.body.set_num, req.body)
    .then(() => {
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

app.get("/lego/deleteSet/:num", ensureLogin, (req, res) => {
  const setNum = req.params.num;

  legoData
    .deleteSet(setNum)
    .then(() => {
      res.redirect("/lego/sets");
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

app.use((req, res) => {
  res
    .status(404)
    .render("404", { message: `Page your looking for doesn't exisit` });
});

legoData.initialize();

legoData
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`app listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(`unable to start server: ${err}`);
  });


function ensureLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}