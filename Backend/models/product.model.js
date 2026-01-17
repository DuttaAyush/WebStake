const mongoose=require("mongoose");
const productSchema=new mongoose.Schema({
    productID:{
        type:String,
        required:true,
        unique:true,
    },
    name:{
        type:String,
        required:true,
        unique:true,
    },
    description:{
        type:String,
        required:true,
    },
    startingPrice:{
        type:Number,
        required:true,
    },
    highestBid:{
        type:Number,
        default:0,
        required:true,
    },
    winTeam:{
        type:mongoose.Schema.type.objectId,
        ref:'team',
    }

})

const productModel = mongoose.model('product', productSchema);
module.exports = productModel;