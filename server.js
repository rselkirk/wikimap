"use strict";

require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();
const cookieSession = require('cookie-session');

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");

const database = require('./db/DB_helper')(knex);

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));
app.use(cookieSession({
  name: 'session',
  keys: ['RGp47WRqpjnK5Eo'],

// cookie options
  maxAge: 24 * 60 * 60 * 1000,
}));

// variable to check for a logged-in user on required pages
const auth = (req, res, next) => {
  if (req.session.user_id) {
    res.locals.user_id = req.session.user_id;
    next();
  } else {
    const templateVars = { user: undefined };
    res.status(401).render('user_error', templateVars);
  }
};

const users = {
  user1: {
    id: 'user1',
    username: 'user1@example.com',
    password: 'purple', // purple (for testing)
  },
};

// Mount all resource routes
app.use("/api/users", usersRoutes(knex));

// Login route (development only)
app.get ("/login/:id", (req, res) => {
  req.session.user_id = req.params.id;
  res.redirect("/");
});

app.post ("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});

// app.get("/", (req, res) => {
//   res.render("index");
// });

// Homepage (all maps)
app.get("/", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  var info = {
    title: 'points', description: 'this is point 3',
    img: '/folderpath3', map_id: 1, lat: 50.9090,
    long: -122.145, user_id: 1};
  database.addPoints(info, (result)=> {console.log(result);},
  (reason)=> {console.log(reason);});
  res.render("all_maps", templateVars);
});



// Delete a single map
app.post ("/maps/:map_id/delete", auth, (req, res) => {
  const map = req.params.map_id;
  //------ delete from database ------;
  res.redirect("/");
});

// Renders form for entering new map starting parameters
app.get ("/maps/new", auth, (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  res.render ("init_map");
});

//Submits form with new map information
app.post ("/maps/new", auth, (req, res) => {
  // ----- creates new map row in database with form info
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  //---- submit form
  //const newMapId = 'map id from database';
  res.render ("create_map", templateVars);
});

// Single map page
app.get ("/maps/:map_id", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  res.render("view_map", templateVars);
});

// // Renders new map with starting parameters
// app.post ("/maps/:id/edit", auth, (req, res) => {
//   const user_id = req.session.user_id;
//   const templateVars = { user_id };
//   res.redirect(`/maps/${newMapId}`)
// });

// Add a point to a map
app.post ("/maps/:map_id/points", auth, (req, res) => {
  //------ adds point info to database -----
  //------ loads all points on map -----
});

// Edit a single point on a map
app.post ("/maps/:map_id/points/:point_id", auth, (req, res) => {
  //----- makes new changes to point in database ------
});

// Delete a single point on a map
app.post ("/maps/:map_id/points/:point_id", auth, (req, res) => {
  const point = req.params.point_id;
  // ------ deletes point id from database ------
});

// Single user profile
app.get ("/users/:id", auth, (req, res) => {
  const username = req.session.user_id;
  const email = 'user2@example.com';
  const first_name =  'John';
  const last_name = 'Smith';
  const templateVars = {username, email, first_name, last_name, picture: 'profilePic' };

  // if (user in database) {
  //     res.render ('profile/:id', templateVars);
  //   } else {
  //     res.status(403).send('You must be logged into view this page.');
  //   }

  res.render ("profile", templateVars);
});

// Add a map to user favourites
app.post ("/users/:id/favourites", auth, (req, res) => {
  // ------ adds favourite/map combo to database table ----- //
});

// Un-favourite a map (remove from favourites list)
app.post ("/users/:id/favourites/:favourite_id/delete", auth, (req, res) => {
  // ------ removes favourite from database ---- //
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
