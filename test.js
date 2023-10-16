/*const express = require('express');
const cors=require('cors')

const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
var path=require('path')

const app = express();
const port = 5000;
app.use(cors())

/*
})

// MongoDB connection (Replace 'your-database-name' with your MongoDB database name)

mongoose.connect('mongodb+srv://emanuelkibiwot:37405568@kimarucluster.fnygrw2.mongodb.net/rentalSystem?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a schema for the user model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

// Create a model based on the schema
const User = mongoose.model('User', userSchema);

// Middleware

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

app.get('/',function(req,res){
    res.sendFile(__dirname +'/public/register.html')
})

//;

/*app.get('/form',(req,res)=>{

    res.sendFile(__dirname + 'public/register.html')
})*
// Passport configuration
passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username }, (err, user) => {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, { message: 'User not found' });
    }
    if (user.password !== password) {
      return done(null, false, { message: 'Incorrect password' });
    }
    return done(null, user);
  });
}));*/
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const path = require('path');
const bcrypt=require('bcrypt')

const app = express();
const port = 5000;
app.use(cors());

mongoose
  .connect('mongodb+srv://emanuelkibiwot:37405568kimm@kimarucluster.fnygrw2.mongodb.net/rentalSearchingdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email:{type:String,required:true}
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username }, (err, user) => {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, { message: 'User not found' });
    }
    bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
      if (bcryptErr || !isMatch) {
        return done(null, false, { message: 'Incorrect password' });
      }
      return done(null, user);
    });
  });
}));


// Routes

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const user = await User.findOne({ username }).exec();
      if (user) {
        return res.status(409).json({ message: 'Username already exists' });
      }
  
      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user object and save it to the database
      const newUser = new User({ username, email, password: hashedPassword });
      console.log(newUser)
      await newUser.save();
  
      // Mask the password before displaying it
      newUser.password = maskPassword(password);
     
      return res.json(newUser);
      
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ message: 'Failed to register user' });
    }
    
  });
  
 
  
  // Function to mask the password with asterisks
  function maskPassword(password) {
    return '*'.repeat(password.length);
    
  }
  
  

app.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  // If authentication succeeds, return the user object
  return res.json(req.user);
});

// Custom middleware to check if the user is authenticated (rent owner)
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// Rental house model
const rentalHouseSchema = new mongoose.Schema({
  location: { type: String, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  rentOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const RentalHouse = mongoose.model('RentalHouse', rentalHouseSchema);

// Route to get rental houses based on search criteria (location, bedrooms, bathrooms)
app.get('/houses', (req, res) => {
  const { location, bedrooms, bathrooms } = req.query;
  const query = {};

  if (location) {
    query.location = location;
  }

  if (bedrooms) {
    query.bedrooms = bedrooms;
  }

  if (bathrooms) {
    query.bathrooms = bathrooms;
  }

  RentalHouse.find(query)
    .populate('rentOwner', 'username') // Include rent owner's username in the result
    .exec((err, houses) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch rental houses' });
      }
      return res.json(houses);
    });
});

// Route to add rental house by the rent owner

// Your other routes and APIs for rental houses go here...

/*app.use(express.static(__dirname + 'public'))\*/

/*app.get('./register',function (req,res){
    res.sendFile(__dirname + 'C:\Users\MANU\Desktop\nodeLogin\public\register.html')
    console.log(req.body)

})*/
app.post('/newRoom', isAuthenticated, (req, res) => {
  const { location, bedrooms, bathrooms } = req.body;
  const rentOwner = req.user._id; // Get the authenticated rent owner's ID

  // Create a new rental house object and save it to the database
  const newRentalHouse = new RentalHouse({ location, bedrooms, bathrooms, rentOwner });
  newRentalHouse.save((err, savedHouse) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to add rental house' });
    }
    return res.json(savedHouse);
  });
});

// Route to get rental houses based on search criteria (location, bedrooms, bathrooms)
app.get('/houses', (req, res) => {
  const { location, bedrooms, bathrooms } = req.query;
  const query = {};

  if (location) {
    query.location = location;
  }

  if (bedrooms) {
    query.bedrooms = bedrooms;
  }

  if (bathrooms) {
    query.bathrooms = bathrooms;
  }

  RentalHouse.find(query)
    .populate('rentOwner', 'username') // Include rent owner's username in the result
    .exec((err, houses) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to fetch rental houses' });
      }
      return res.json(houses);
    });
});

app.get('/',function(req,res){
    res.sendFile(__dirname +'/public/test.html')
})
app.get('/registerfile',function(req,res){
    res.sendFile(__dirname +'/public/register.html')
})
app.get('/testfile',function(req,res){
    res.sendFile(__dirname +'/public/test.html')
})
app.get('/newRoomfile',function(req,res){
    res.sendFile(__dirname +'/public/newRoom.html')
})
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
