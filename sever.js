const express = require('express');
const path=require('path')
//var PouchDB = require('pouchdb');
const cors = require('cors');
const nodemailer = require('nodemailer')
const dotenv=require('dotenv')

const AdminBroMongoose=require('admin-bro-mongoose')

const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session')
const adminRouter=require('./admin.router')
const {upload}=require('./public/middleware/uploads')

const AdminBro = require('admin-bro');
const AdminBroExpress = require('admin-bro-expressjs')

const app = express();
const port = 5000;
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/admin',adminRouter)


//const newRoomId = new mongoose.Types.ObjectId();

// Convert the ObjectId to a string


mongoose
  .connect('mongodb+srv://emanuelkibiwot:37405568kimm@kimarucluster.fnygrw2.mongodb.net/rentalSearchingdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Use the AdminBroMongoose adapter
   /* AdminBro.registerAdapter(AdminBroMongoose);

    const adminBro = new AdminBro({
      databases: [mongoose],
      rootPath: '/admin',
    });
    const ADMIN = {
      email: 'admin@example.com', // Replace with the admin's email
      password: 'password',      // Replace with the admin's password
    };

    const router = AdminBroExpress.buildAuthenticatedRouter(adminBro, {
      authenticate: async (email, password) => {
        if (ADMIN.email === email && ADMIN.password === password) {
          return ADMIN;
        }
        return null;
      },
    });
  

    // Set up the admin panel
    app.use(adminBro.options.rootPath, router);*/ 
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
   // process.exit(1); // Exit the app if there's a database connection error
  });

// Define your routes and other middleware here





const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);




app.post('/login', async (req, res) => {

    const { email, password } = req.body
  
    // Check for user email
    const user = await User.findOne({ email })
  
    if (user && (await bcrypt.compare(password, user.password))) {
    // if(user){
      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
       
        
      })
    
    } else {
      res.status(400).json({ error: 'Check your email or password' });
     
      
    }
  
  
});










const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'emanuel.kibiwot@gmail.com', // Replace with your Gmail email address
    pass: '37405568', // Replace with your Gmail password
  },
});

// Define a function to send an email
function sendEmail(to, subject, text) {
  const mailOptions = {
    from: 'emanuel.kibiwot@gmail.com',
    to: to,
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}
//REGISTER ROUTE

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  console.log(req.body)
  try {
    const user = await User.findOne({ email }).exec();
    if (user) {
      return res.status(409).json({ message: 'emailsername already exists' });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user object and save it to the database
    const newUser = new User({ username, email, password: hashedPassword });
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



// Rental house model
const newRoomSchema = new mongoose.Schema({
  roomType: { type: String, required: true },
  location: { type: String, required: true },
  county: { type: String, required: true },
  price: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  room_description:{type: String,required:true},
  roomDeposit:{type: Number, required:true},
  bedRooms: { type: Number, required: false},
  secretkey:{type:Number, required:true},
  roomImage: { type: String },
 
 
  booked: { type: Boolean, default: false }, 
  phoneNumber:{type: Number, required:true},
  
});

const NewRoom = mongoose.model('NewRoom', newRoomSchema);

//NEW ROOM ROUTE
app.post('/newRoom', upload.single('roomImage'), async (req, res) => {
  const { roomType, county, location, price, bedrooms, bathrooms,room_description,roomDeposit,phoneNumber,secretkey} = req.body;
  const roomImage = req.file.originalname;
  const newRoomData = new NewRoom({ roomType, county, location, price, bedrooms, bathrooms, roomDeposit,room_description,phoneNumber, roomImage,secretkey });
        
  try {
    const savedRoom = await newRoomData.save();
    return res.json(savedRoom); // Respond with the newly created room data
  } catch (error) {
    console.error('Error adding new room:', error);
    return res.status(500).json({ message: 'Failed to add new room' });
  }
});

//secerekey for booking room

app.get('/validateSecretKey', async (req, res) => {
  const roomId = req.query.roomId;
  const secretKey = parseInt(req.query.secretKey.trim(), 10);
  

console.log(roomId)

  //const secretKey = req.query.secretKey;
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ error: 'Invalid Room ID' });
  }

  try {
    const room = await NewRoom.findById(roomId);
    console.log(typeof secretKey, typeof room.secretkey);

    if (!room) {
      console.log('Room not found');
      return res.status(404).json({ isValid: false, error: 'Room not found' });
    }

    /*if (isNaN(secretKey) || room.secretKey !== secretKey) {
      console.log('Invalid secret key');
      return res.status(400).json({ isValid: false, error: 'Invalid secret key' });
    }*/
    if(secretKey==room.secretkey){
      console.log('Secret key is valid');
      res.json({ isValid: true });
    }else {
      console.log('Invalid secret key');
      return res.status(400).json({ isValid: false, error: 'Invalid secret key' })
      
    }
 
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ isValid: false });
  }
});



const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  checkIn: {
      type:String,
      required:true  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'newRoom', required: true },
});

const Booking = mongoose.model('Booking', bookingSchema);

/*app.post('/booking', async (req, res) => {
  const { name, email, phone, checkIn } = req.body;
  // Assuming you have a roomId in the request to identify the room being booked
  //const { roomId } = req.body;
  const roomId = req.body.roomId;
  res.json({ message: 'Booking successful', roomId: roomId });

  try {
      // Update the booked property of the room with the specified roomId
      await NewRoom.updateOne({ _id: roomId }, { $set: { booked: true } });

      // Create a new booking record
      const bookingData = new Booking({ name, email, phone, checkIn });
      await bookingData.save();

      return res.json({ message: 'Room booked successfully', roomId });
  } catch (error) {
      console.error('Error booking room:', error);
      return res.status(500).json({ message: 'Failed to book room' });
  }
});

*/
//BOOKING ROUTE
app.post('/booking', async (req, res) => {
  const { name, email, phone, checkIn, roomId } = req.body; // Removed the default value for roomId
  console.log(roomId)

  try {
    // Find the room to be booked in the database
    const roomToBook = await NewRoom.findById(roomId);
    console.log(roomToBook)

    if (!roomToBook) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if the room is already booked
    if (roomToBook.booked) {
      return res.status(400).json({ message: 'Room is already booked' });
    }

    // Mark the room as booked
    roomToBook.booked = true;
    await roomToBook.save();

    // Create a new booking record with the room's ID
    const bookingData = new Booking({ name, email, phone, checkIn, roomId });
    await bookingData.save();

    const ownerEmail =User.email;

    // Send an email notification to the rental owner
    sendEmail(ownerEmail, 'Room Booking Notification', `Your room has been booked by ${name} for ${checkIn}. Contact them at ${email} or ${phone}.`);

    // Fetch all available rooms excluding the booked room
    const availableRooms = await NewRoom.find({ _id: { $ne: roomToBook._id }, booked: false }).exec();
    console.log(availableRooms)
    return res.json({ message: 'Room booked successfully', availableRooms });
  } catch (error) {
    console.error('Error booking room:', error);
    return res.status(500).json({ message: 'Failed to book room' });
  }
});




// Route to search for rooms based on county and location
app.post('/searchRooms', async (req, res) => {
  const {location } = req.body;
  

  try {
    // Create an initial query object with the location criteria
    const query = {
      location: { $regex: location, $options: 'i' }, 
      booked: false,
     // Case-insensitive search for location
    };

    // Check if county is provided and add it to the query if so
    if (location) {
      // If county is an array of values, modify the query to use $in operator
      if (Array.isArray(location)) {
        query.location = { $in: location.map(area => new RegExp(area, 'i')) };
      } else {
        query.location = { $regex:location, $options: 'i' }; // Case-insensitive search for county
      }
    }

    // Use Mongoose to query the NewRoom model based on the query
    const searchResults = await NewRoom.find(query ,{ booked: false }).exec();
   

    // Send the search results back to the client as JSON
    return res.json(searchResults);
  } catch (error) {
    console.error('Error searching for rooms:', error);
    return res.status(500).json({ message: 'Failed to search for rooms' });
  }
});



// Add this route to fetch all room data


app.get('/allRooms', async (req, res) => {
  try {
    const rooms = await NewRoom.find({ booked: false }).exec();
    return res.json(rooms);
  } catch (error) {
    console.error('Error fetching all room data:', error);
    return res.status(500).json({ message: 'Failed to fetch room data' });
  }
});



// Define a route to view room details
app.get('/roomDetails/:roomId', async (req, res) => {
  const roomId = req.params.roomId;

  try {
    // Validate if roomId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ error: 'Invalid Room ID' });
    }

    // Find the room with the given ID in the database
    const room = await  NewRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Render an HTML page with the room details
    res.render('roomDetails', { room });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/*app.get('/roomDetails', async (req, res) => {
  const roomId = req.query.roomId; // Assuming the room ID is a string

  try {
      // Use Mongoose to find the room by ID
      const room = await NewRoom.findById(_id);

      if (!room) {
          return res.status(404).json({ error: 'Room not found' });
      }

      res.json(room);
  } catch (error) {
      console.error('Error fetching room details:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
})*/

/*app.get('/roomDetails', (req, res) => {
  const roomId = parseInt(req.query.roomId);

  // Find the room with the given ID

  const room = rooms.find((room) => room.id === roomId);
console.log(room)
  if (!room) {
      return res.status(404).json({ error: 'Room not found' });
  

  res.json(room);
});
*/
/*app.get('/allRooms', async (req, res) => {
  try {
    const rooms = await NewRoom.find({ booked: false }).exec(); // Only fetch rooms with booked status false
    return res.json(rooms);
  } catch (error) {
    console.error('Error fetching all room data:', error);
    return res.status(500).json({ message: 'Failed to fetch room data' });
  }
});
*/

app.get('/booking.html', (req, res) => {
  res.sendFile(__dirname + '/public/booking.html');
});





// Your other routes and APIs for rental houses go here...

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/homePage.html');
});
app.get('/room_description.html', (req, res) => {
  res.sendFile(__dirname + '/public/room_description.html');
});

app.get('/registerfile', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

app.get('/registerfile', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});
app.get('/newRoomfile', (req, res) => {
  res.sendFile(__dirname + '/public/newRoom.html');
});
app.get('/loginfile', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/testfile', (req, res) => {
  res.sendFile(__dirname + '/public/test.html');
});
app.get('/bookingfile', (req, res) => {
  res.sendFile(__dirname + '/public/booking.html');
});

app.get('/newRoomfile', (req, res) => {
  res.sendFile(__dirname + '/public/newRoom.html');
});




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); 

});

