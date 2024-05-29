const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const mongoose = require("mongoose");
const Models = require("./models.js");
const { check, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();
const cors = require("cors");
app.use(cors());
let auth = require("./auth")(app);
const passport = require("passport");
const { title } = require("process");
require("./passport");

const Movies = Models.Movie;
const Users = Models.User;

// //connecting to the local db
// mongoose.connect("mongodb://localhost:27017/mySciFiApp", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

//connecting to db hosted at atlas

mongoose.connect(process.env.DB_CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.json());

// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
});
//setup the logger
app.use(morgan("combined", { stream: accessLogStream }));

app.get("/", (req, res) => {
  res.send("Welcome to my Sci-Fi page!");
});

//return all movies vom the db as json file
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//return a single movie in a JSON file
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    reqTitle = req.params.title;
    Movies.findOne({ title: reqTitle })
      .then((movie) => {
        if (movie) {
          console.log(movie);
          res.status(200).json(movie);
        } else {
          res.status(404).send("404: Movie could not be found");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//return genre of a movie
app.get(
  "/movies/genre/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    reqTitle = req.params.title;
    Movies.findOne({ title: reqTitle })
      .then((movie) => {
        console.log(movie);
        if (movie) {
          genre = movie.genre;
          res.status(200).json(genre);
        } else {
          res.status(404).send("404: Movie could not be found.");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//return data about director
app.get(
  "/movies/director/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    reqTitle = req.params.title;
    Movies.findOne({ title: reqTitle })
      .then((movie) => {
        if (movie) {
          director = movie.director;
          res.status(200).json(director);
        } else {
          res.status(404).send("404: Movie could not be found.");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//register new user in db
app.post(
  "/users/register/",
  [
    check(
      "Username",
      "Username is required, including at least five characters"
    ).isLength({ min: 5 }),
    check(
      "Username",
      "Username may only include letters and numbers."
    ).isAlphanumeric(),
    check("name", "name is required with at least 5 characters.").isLength({
      min: 5,
    }),
    check("email", "valid email is requires").isEmail(),
    check(
      "Password",
      "Password is required with at least 8 characters."
    ).isLength({ min: 8 }),
    check(
      "Password",
      "Password may only include letters and numbers."
    ).isAlphanumeric(),
    check(
      "Birthday",
      "Birthday can either be not defined or in the format of DDMMYYY"
    )
      .optional()
      .matches(/^\d{2}\d{2}\d{4}$/),
  ],
  async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const newUser = req.body;
    let hashedPassword = Users.hashPassword(newUser.Password);
    await Users.findOne({ Username: newUser.Username })
      .then((user) => {
        if (user) {
          return res
            .status(400)
            .send("User " + newUser.Username + " already exists.");
        } else {
          Users.create({
            name: newUser.name,
            Username: newUser.Username,
            email: newUser.email,
            Password: hashedPassword,
            Birthday: newUser.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//update password
app.put("/users/newpassword",[check(
  "Password",
  "Password is required with at least 8 characters."
).isLength({ min: 8 })],
passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let hashedPassword = Users.hashPassword(req.body.Password);
    console.log(hashedPassword)
    await Users.findOneAndUpdate({Username:req.user.Username},{$set: {Password:hashedPassword}})
    .then(res.send("Password updated."))
    .catch((error)=>{res.send("not updated" + error)})
  }
)

//update username
app.put(
  "/users/newusername",
  [
    check("oldUserName", "oldUserName is required").not().isEmpty(),
    check(
      "newUserName",
      "newUserName is required, including at least five characters"
    ).isLength({ min: 5 }),
    check(
      "newUserName",
      "newUserName may only include letters and numbers."
    ).isAlphanumeric(),
  ],
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const oldUsername = req.body.oldUserName;
    const newUsername = req.body.newUserName;
    if (req.user.Username !== oldUsername) {
      return res.status(400).send("Permission denied");
    }

    await Users.findOneAndUpdate(
      { Username: oldUsername },
      {
        $set: { Username: newUsername },
      },
      { new: true }
    )
      .then((user) => {
        res.status(200).json(user);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//update username, name, email and birthday
app.put(
  "/users/newdetails",
  [
    check("Username", "Username is required, including at least five characters").optional().isLength({min:5}),
    check("name", "name is required with at least 5 characters.")
      .optional()
      .isLength({ min: 5 }),
    check("email", "valid email is requires").optional().isEmail(),
    check(
      "Birthday",
      "Birthday can either be not defined or in the format of DDMMYYY"
    )
      .optional()
      .matches(/^\d{2}\d{2}\d{4}$/),
  ],
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    if (!req.body.Username && !req.body.name && !req.body.email && !req.body.Birthday) {
      res.status(400).send("no valid data sent");
    } else {
      if (req.body.name) {
        await Users.findOneAndUpdate(
          { Username: req.user.Username },
          { $set: { name: req.body.name } }
        );
      }

      if (req.body.email) {
        await Users.findOneAndUpdate(
          { Username: req.user.Username },
          { $set: { email: req.body.email } }
        );
      }

      if (req.body.Birthday) {
        await Users.findOneAndUpdate(
          { Username: req.user.Username },
          { $set: { Birthday: req.body.Birthday } }
        );
      }

      if (req.body.Username) {
        await Users.findOneAndUpdate(
          { Username: req.user.Username },
          { $set: { Username: req.body.Username } }
        );
      }

      if (!req.body.Username) {
      Users.findOne({ Username: req.user.Username }).then((user) => {
        res.json(user);
      })}else{
        Users.findOne({ Username: req.body.Username })
        .then((user) => {
          res.json(user)
        });
      }
    }
  }
);

//deregister user
app.delete(
  "/users/delete",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const userToDelete = req.body.Username;
    if (req.user.Username !== userToDelete) {
      return res.status(400).send("Permission denied");
    }
    Users.findOneAndDelete({ Username: userToDelete }, { new: true })
      .then((user) => {
        res.status(200).send("User " + user.Username + " deleted.");
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//add favorite movie
app.post(
  "/users/favoritemovie/",
  [check("favoriteMovie", "favoriteMovie may only include letters, numbers and spaces").matches(/^[a-zA-Z0-9 ]*$/)],
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const reqUsername = req.body.Username;
    const titleMovie = req.body.favoriteMovie;
    console.log(req.user.Username);
    if (req.user.Username !== reqUsername) {
      return res.status(400).send("Permission denied");
    }
    Movies.findOne({ title: titleMovie })
      .then((movie) => {
        //console.log(movie._id === "663a4446f5fc80b9c0e00d93")
        if (movie) {
          Users.findOneAndUpdate(
            { Username: reqUsername },
            { $addToSet: { favoriteMovies: movie._id } }
          ).then((user) => {
            res
              .status(200)
              .send(
                titleMovie +
                  " was added to favorite movie list of " +
                  reqUsername +
                  "."
              );
          });
        } else {
          res.status(400).send("400: Movie not registered.");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//delete favorite movie
app.delete(
  "/users/favoritemovie/",
  [check("favoriteMovie", "favoriteMovie may only include letters").matches(/^[a-zA-Z0-9 ]*$/)],
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const reqUsername = req.body.Username;
    const titleMovie = req.body.favoriteMovie;
    if (req.user.Username !== reqUsername) {
      return res.status(400).send("Permission denied");
    }
    Movies.findOne({ title: titleMovie })
      .then((movie) => {
        if (movie) {
          Users.findOneAndUpdate(
            { Username: reqUsername },
            { $pull: { favoriteMovies: movie._id } }
          ).then((user) => {
            res
              .status(200)
              .send(
                titleMovie +
                  " was removed from favorite movie list of " +
                  reqUsername +
                  "."
              );
          });
        } else {
          res.status(400).send("400: Movie not registered.");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

app.use(express.static("public"));

//error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("App is up and running on " + port);
});
