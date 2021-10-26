const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv')

dotenv.config({path: __dirname +'/../config/config.env'})

const mongoURI = "mongodb+srv://"+process.env.mongoUserName+":"+process.env.mongoPassword+"@"+process.env.mongoID+".7ifam.mongodb.net/Cookie-auth?retryWrites=true&w=majority"

const conn = mongoose.createConnection(mongoURI,{
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true
})

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

// hashing the password

userSchema.pre("save",function(next){
    if(!this.isModified("password")){
        return next()
    } 
    this.password = bcrypt.hashSync(this.password,10)
    next()
})


const userModel = conn.model("user",userSchema)

module.exports = userModel