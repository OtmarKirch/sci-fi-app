const mongoose = require("mongoose");

let movieSchema = mongoose.Schema({
  title: { type: String, requrired: true },
  description: { type: String, requried: true },
  genre: {
    name: String,
    description: String,
  },
  director: {
    name: String,
    description: String,
  },
  birthyear: {type: Date},
  deathyear: {type: Date},
  ranking: {type: Number, min: 1, max: 10}
});

let userSchema = mongoose.Schema({
  name: { type: String, required: true },
  Username: { type: String, required: true },
  email: { type: String, required: true },
  Password: { type: String, required: true },
  favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  Birthday: Date,
});

let Movie = mongoose.model("Movie", movieSchema);
let User = mongoose.model("User", userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
