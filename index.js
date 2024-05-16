const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const mongoose = require("mongoose");
const Models = require("./models.js");
const {check, validationResult} = require("express-validator")

const app = express();
const cors = require("cors");
app.use(cors())
let auth = require("./auth")(app);
const passport = require("passport");
require("./passport");

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect("mongodb://localhost:27017/mySciFiApp", {
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
app.post("/users/register/", [
  check("Username", "Username is required, including at least five characters").isLength({min:5}),
  check("Username", "Username may only include letters and numbers.").isAlphanumeric(),
  check("name", "name is required with at least 5 characters.").isLength({min:5}),
  check("email", "valid email is requires").isEmail(),
  check("Password", "Password is required with at least 8 characters.").isLength({min:8}),
  check("Password", "Password may only include letters and numbers.").isAlphanumeric(),
  check("Birthday", "Birthday can either be not defined or in the format of DDMMYYY").optional().matches(/^\d{2}\d{2}\d{4}$/)
], async (req, res) => {
  let errors = validationResult(req);

  if (!errors.isEmpty()){
    return res.status(422).json({errors: errors.array()})
  }

  const newUser = req.body;
  let hashedPassword = Users.hashPassword(newUser.Password)
  await Users.findOne({ Username: newUser.Username })
    .then((user) => {
      if (user) {
        return res
          .status(400)
          .send("User " + newUser.username + " already exists.");
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
});

//update username
app.put(
  "/users/newusername",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
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
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const reqUsername = req.body.Username;
    const titleMovie = req.body.favoriteMovie;
    console.log(req.user.Username);
    if (req.user.Username !== reqUsername) {
      return res.status(400).send("Permission denied");
    }
    Movies.findOne({ title: titleMovie })
      .then((movie) => {
        if (movie) {
          Users.findOneAndUpdate(
            { username: reqUsername },
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
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const reqUsername = req.body.Username;
    const titleMovie = req.body.favoriteMovie;
    if (req.user.Username !== reqUsername) {
      return res.status(400).send("Permission denied");
    }
    Movies.findOne({ title: titleMovie })
      .then((movie) => {
        if (movie) {
          Users.findOneAndUpdate(
            { username: reqUsername },
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
