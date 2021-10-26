const express = require('express')
const dotenv = require('dotenv')
const session = require('express-session')
const mongoDBSession = require('connect-mongodb-session')(session)
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const ejs = require('ejs')

//MongoDB Model
const UserModel = require('./models/userDB')

const app = express();

// ---> Set up to use static files
app.use(express.static('assets'))

// ---> For EJS
app.set('view engine', 'ejs');

// ---> CONFIGURING .ENV
dotenv.config({path:'./config/config.env'})

// ---> For body parser
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// ---> Connect MongoDB
const mongoURI = "mongodb+srv://"+process.env.mongoUserName+":"+process.env.mongoPassword+"@"+process.env.mongoID+".7ifam.mongodb.net/Cookie-auth?retryWrites=true&w=majority"
mongoose
    .createConnection(mongoURI,{
        useNewUrlParser : true,
        useUnifiedTopology : true,
        useCreateIndex : true
    })
    .then((res)=>{
        console.log("MongoDB Connected")
    })

const store = new mongoDBSession({
    uri : mongoURI,
    collection : "sessions"
})

// ---> Middleware for sessions
app.use(session({
    key: "Session_ID",
    rolling:true,
    secret: process.env.secret,
    resave: false, //on every req to server do not create new session
    saveUninitialized: false, // if session not modified do not save
    store : store,
    cookie: {
        // max age of cookie is set to 1 min.
        // if user is idle for 1 min,cookie will expire.
        // maxAge : 60000
    }
}))

// ---> checks authentiction
const isAuth = (req,res,next)=>{
    if(req.session.isAuth){
        next()
    }
    else{
        res.redirect('/login')
    }
}

app.get('/',(req,res)=>{
    res.redirect('/login');
})

app.route('/login')
    .get((req,res)=>{
        if(req.session.isAuth){
            res.redirect('/dashboard')
        }
        res.render('login')
    })
    .post(async (req, res)=>{
        const {email,password} = req.body;
        let user = await UserModel.findOne({email});
        if(!user){
            return res.redirect('/login')
        } 
        const isMatch  = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.redirect('/login')
        }
        req.session.isAuth = true;
        res.redirect('/dashboard')
    })


app.route('/register')
    .get((req,res)=>{
        res.render('register')
    })
    .post(async (req,res)=>{
        const {name,email,phone,password} = req.body;
        let user = await UserModel.findOne({email});
        if(user){
            res.redirect('/register')
        }
        user = new UserModel({
            name,
            email,
            phone,
            password
        })

        await user.save();
        res.redirect('/login')
    })

app.route('/dashboard')
    .get(isAuth,(req,res)=>{
        res.render('dashboard')
    })

app.route('/logout')
    .get((req,res)=>{
        req.session.isAuth = false;
        req.session.destroy((err)=>{
            if(err){
                throw err
            }
            res.redirect('/')
        })
    })


const port = process.env.PORT 

app.listen(port,()=>{
    console.log("Server started listening on port : "+port);
})