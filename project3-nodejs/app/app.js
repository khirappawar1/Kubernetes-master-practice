require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Visitor = require("./models/visitor");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const mongoURL =
`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;

mongoose.connect(mongoURL)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

app.get("/", async(req,res)=>{

    const visitors=await Visitor.find().sort({createdAt:-1});

    res.render("index",{
        visitors
    });

});

app.post("/add",async(req,res)=>{

    const visitor=new Visitor({

        name:req.body.name,
        message:req.body.message

    });

    await visitor.save();

    res.redirect("/");

});

app.get("/health",(req,res)=>{

    res.send("Healthy");

});

app.listen(PORT,()=>{

    console.log(`Server running on ${PORT}`);

});