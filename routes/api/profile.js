const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//validation loader
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

//profile model loader
const Profile = require('../../models/Profile');
//user profile loader
const User = require('../../models/User');

//GET api/profile/test
/* 
test profile route
Public Access
*/
router.get('/test' , (req, res) => res.json({msg: "Profile Works"}));
//GET api/profile
/* 
Get current user's Profile
Private Access
*/
router.get('/' , passport.authenticate('jwt', { session: false}), (req, res)=>{
    const errors = {};
    Profile.findOne({ user: req.user.id })
        .populate('user' , ['name' , 'avatar'])
        .then(profile => {
            if(!profile) {
                errors.noprofile = 'There is no profile for this user'
                return res.status(404).json(errors);
            }
            res.json(profile);

        })
        .catch(err => res.status(404).json(err));
        
});
//Get api/profile/all
/* 
get ALL profile 
Public Access
*/

router.get('/all' , (req, res) => {
    const errors ={};
    Profile.find()
    .populate('user' , ['name' , 'avatar'])
    .then(profiles => {
        if(!profiles) {
            errors.noprofile = 'There are no profiles'
            return res.status(404).json(errors)
        }
        res.json(profiles);
    })
    .catch(err => res.status(404).json({profile: 'There are no profiles'}));


})

//Get api/profile/handle/:handle
/* 
get profile by handle
Public Access
*/
router.get('/handle/:handle', (req, res) => {
    const errors = {};
  
    Profile.findOne({ handle: req.params.handle })
      .populate('user', ['name', 'avatar'])
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          res.status(404).json(errors);
        }
  
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  });
//Get api/profile/user/:user
/* 
Get profile by user id
Public Access
*/
router.get('/user/:user_id', ( req, res) => {
    const errors = {};
    Profile.findOne({ user: req.params.user_id })
        .populate('user' , ['name' , 'avatar'])
        .then(profile => {
        if(!profile) {
            errors.noprofile = 'No profile found';
            res.status(404).res.json(errors)        
        }

        res.json(profile);
    })
    .catch(err => res.status(404).json({profile: 'There is no profile for that user'}));
});

//Post api/profile
/* 
create||update user's Profile
Private Access
*/
router.post('/' , passport.authenticate('jwt', { session: false}), (req, res)=>{
    const {errors, isValid} = validateProfileInput(req.body);
    //check validation
    if(!isValid){
        //return errors 400 status
        return res.status(400).json(errors);
    }

    // get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
      // Skills - Spilt into array
      if (typeof req.body.skills !== 'undefined') {
        profileFields.skills = req.body.skills.split(',');
      }
    //Social Media
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id })
      .then(profile => {
          if(profile){
            //update
            Profile.findOneAndUpdate(
                { user: req.user.id }, 
                { $set: profileFields }, 
                {new: true}
            ).then(profile => res.json(profile));

          } else {
            //create

            //check IF handle exists
            Profile.findOne({ handle: profileFields.handle })
            .then(profile => {
                if(profile){
                    errors.handle = 'That handle already exists';
                    res.status(400).json(errors);
                }
            //save profile
            new Profile(profileFields).save().then(profile => res.json(profile));
            })
          }
      })
});
//Post api/profile/experience
/* 
add experience to profile
Private Access
*/
router.post('/experience' , passport.authenticate('jwt', {session: false}), (req,res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to exp array
      profile.experience.unshift(newExp);

      profile.save().then(profile => res.json(profile));
    });
});
//Post api/profile/education
/* 
add education to profile
Private Access
*/
router.post('/education' , passport.authenticate('jwt', {session: false}), (req,res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to exp array
      profile.education.unshift(newEdu);

      profile.save().then(profile => res.json(profile));
    });
});
//Delete api/profile/experience/:exp_id
/* 
delete experience from profile
Private Access
*/
router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {
      Profile.findOne({ user: req.user.id })
        .then(profile => {
          // Get remove index
          const removeIndex = profile.experience
            .map(item => item.id)
            .indexOf(req.params.exp_id);
  
          // Splice out of array
          profile.experience.splice(removeIndex, 1);
  
          // Save
          profile.save().then(profile => res.json(profile));
        })
        .catch(err => res.status(404).json(err));
});
//Delete api/profile/education/:exp_id
/* 
delete education from profile
Private Access
*/
router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);

        // Splice out of array
        profile.education.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
});
//Delete api/profile
/* 
delete user and profile
Private Access
*/
router.delete( '/', passport.authenticate('jwt', { session: false }), (req, res) => {
      Profile.findOneAndRemove({ user: req.user.id }).then(() => {
        User.findOneAndRemove({ _id: req.user.id }).then(() =>
          res.json({ success: true })
        );
    });
});

module.exports = router;