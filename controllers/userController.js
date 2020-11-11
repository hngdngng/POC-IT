const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

// Load input Validation
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");

module.exports = {
    findAll: (req, res) => {
      db.User.find(req.query)
        .then(dbUser => res.json(dbUser))
        .catch(err => res.status(422).json(err));
    },
    register: (req, res) => {
      console.log("register api hit");
      const { errors, isValid } = validateRegisterInput(req.body);
      if (!isValid) {
        return res.status(400).json(errors);
      }
      db.User.findOne({ email: req.body.email }).then(user => {
        if (user) {
          return res.status(400).json({ email: "Email already exists" });
        } else {
          const newUser = new db.User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            isProvider: req.body.isProvider
          });
  
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser
                .save()
                .then(user => res.json(user))
                .catch(err => console.log(err));
            });
          });
        }
      });
    },
    login: (req, res) => {
      const { errors, isValid } = validateLoginInput(req.body);
  
      if (!isValid) {
        return res.status(400).json(errors);
      }
  
      const email = req.body.email;
      const password = req.body.password;
  
      db.User.findOne({ email }).then(user => {
        if (!user) {
          return res.status(404).json({ emailnotfound: "Email not found" });
        }
        bcrypt.compare(password, user.password).then(isMatch => {
          if (isMatch) {
            const payload = {
              id: user.id,
              name: user.name
            };
            jwt.sign(
              payload,
              keys.secretOrKey,
              {
                expiresIn: 31556926
              },
              (err, token) => {
                res.json({
                  success: true,
                  token: "Bearer " + token
                });
              }
            );
          } else {
            return res.status(400).json({ passwordincorrect: "Password incorrect" });
          }
        });
      });
    }
  };