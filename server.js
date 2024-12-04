/********************************************************************************
* WEB322 – Assignment 06
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
* Name: ________Kunika Sood______________ Student ID: __156799223____________ Date: __02-12-2024____________
*
* Published URL: ___________________________________________________________
*
*******************************************************************************/
const express = require("express");
require("dotenv").config();
const legoData = require("./modules/legoSets");
const app = express();
app.set("view engine", "ejs"); // Set EJS as view engine
const PORT = process.env.PORT || 2004; // Set port
const path = require("path");
app.use(express.static(path.join(__dirname + "/public")));
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");
require("pg");

app.use(express.urlencoded({ extended: true })); // Middleware for parsing request body


app.set("views", __dirname + "/views");

legoData
  .initialize() // Initialize Lego data
  .then(authData.initialize) // Initialize auth data
  .then(() => {
    // Session management
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  });
  app.use(clientSessions({
    cookieName: "session",
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr",
    duration: 24 * 60 * 60 * 1000, // 1 day session
    activeDuration: 1000 * 60 * 5, // Session active for 5 mins
  }));

  app.use((req, res, next) => {
    res.locals.session = req.session; // Add session to views
    next();
  });

  // Ensure user is logged in for protected routes
  function ensureLogin(req, res, next) {
    if (req.session && req.session.user) {
      next(); // Continue if logged in
    } else {
      res.redirect("/login"); // Redirect to login if not
    }
  }

  // Route for home page
  app.get("/", (req, res) => {
    res.render("home", { session: req.session });
  });

  // Route to show Lego sets by theme
  app.get("/lego/sets", (req, res) => {
    const { theme } = req.query;
    if (theme) {
      legoData.getSetsByTheme(theme)
        .then(sets => {
          res.render("sets", { sets, session: req.session });
        })
        .catch(err => {
          res.status(500).render("404", { message: `No sets found for theme "${theme}".` });
        });
    } else {
      legoData.getAllSets()
        .then(sets => {
          res.render("sets", { sets, session: req.session });
        })
        .catch(err => {
          res.status(500).send(err);
        });
    }
  });

  // Route for adding a new Lego set
  app.get("/lego/addSet", ensureLogin, (req, res) => {
    legoData.
    getAllThemes()
      .then(themes => {
        res.render("addSet", { themes, session: req.session });
      })
      .catch(err => {
        res.render("500", { message: `Error: ${err}` });
      });
  });

  app.post("/lego/addSet", ensureLogin, (req, res) => {
    const setData = req.body;
    legoData.
    addSet(setData)
      .then(() => {
        res.redirect("/lego/sets");
      })
      .catch(err => {
        res.render("500", { message: `Error: ${err}` });
      });
  });

  // Route for user login
  app.get("/login", (req, res) => {
    res.render("login", { errorMessage: null });
  });

  app.post("/login", (req, res) => {
    authData.checkUser(req.body)
      .then(user => {
        req.session.user = { userName: user.userName, email: user.email };
        res.redirect("/lego/sets");
      })
      .catch(err => {
        res.render("login", { errorMessage: err });
      });
  });

  // Route for user logout
  app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
  });

  // 404 error handling
  app.use((req, res, next) => {
    res.status(404).render("404", { message: "Page not found" });
  });

