const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");

const teamSchema=new mongoose.Schema({
    teamID:{
        type:String,
        required:true,
        unique:true,
    },
    name:{
        type:String,
        required:true,
        unique:true,
    },
    members:{
        type:[String],
        required:true,
        default:[],
    },
    points:{
        type:Number,
        default:0,
        required:true,
    },
    password:{
        type:String,
        required:true,
    }

})

teamSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({_id: this._id}, process.env.JWT_SECRET,{ expiresIn: '1d'});
    return token;
}

teamSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

teamSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const teamModel = mongoose.model('team', teamSchema);
module.exports = teamModel;