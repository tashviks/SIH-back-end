const dotenv = require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");

const app = express();
app.use(cors({
    origin: ["http://localhost:3000"]
}));
app.use(express.json());
const saltRounds = process.env.SALT_ROUNDS;

mongoose.connect(process.env.ATLAS);

const univSchema = new mongoose.Schema({
    name: String,
    email: String
});

const studSchema = new mongoose.Schema({
    profile: String,
    username: String,
    email: String,
    password: String
});

const projSchema = new mongoose.Schema({
    userEmail: String,
    teamLeader: String,
    teamMembers: Array,
    facultyMentor: String,
    projectTitle: String,
    projectDescription: String,
    selectedTags: Array,
    images: Array
});

const University = mongoose.model("University", univSchema);
const Student = mongoose.model("Student", studSchema);
const Project = mongoose.model("Project", projSchema);

app.post("/api/auth/register", (req, res)=> {
    async function search() {
        const user = await Student.findOne({email: req.body.email});
        const univ = await University.findOne({email: req.body.email.slice(req.body.email.indexOf('@'))})
        let pass = "";
        if (!user && univ)
        {
            bcrypt.hash(req.body.password, Number(saltRounds), async function(err, hash) {
                pass = hash;
                const stud = new Student({
                    ...req.body,
                    password: hash
                });
                await stud.save();
            });
            res.json({status: true, user: {...req.body, password: pass}});
        }
        else
        {
            if (user) {
                res.json({status: false, msg: "Email already Registered"});
            }
            else {
                res.json({status: false, msg: "Email does not match registered Universities"});
            }
        }
    }
    search();
});

app.post("/api/auth/login", (req, res)=> {
    async function search() {
        const user = await Student.findOne({email: req.body.email});
        if (!user)
        {
            res.json({status: false, msg: "Incorrect Email or Password"});
        }
        else
        {
            const hash = user.password;
            bcrypt.compare(req.body.password, hash, function(err, result) {
                if(result)
                {
                    res.json({status: true, user: {email: user.email, password: user.password, username: user.username}});
                }
                else
                {
                    res.json({status: false, msg: "Incorrect Email or Password"});
                }
            });
        }
    }
    search();
});

app.post("/api/auth/addproject", async (req, res)=> {
    const proj = new Project({...req.body});
    await proj.save();
})

app.get("/api/auth/univprojects", async (req, res)=> {
    const univ = new Array(101);
    const projects = await Project.find();
    for (let i = 0; i < projects.length; i++) {
        const email = projects[i].userEmail;
        const univNumber = Number(email.slice(email.search("@univ") + 5, email.search(".com")));
        if (!univ[univNumber]) {
            univ[univNumber] = [projects[i]]
        }
        else {
            univ[univNumber].push(projects[i]);
        }
    }
    res.json({"data": univ});
})

app.get("/api/auth/perprojects/:email", async (req, res)=> {
    let email = req.params.email;
    const projects = await Project.find({userEmail: email});
    res.json({"projectsList": projects});
})

app.listen(5000, () => {
    console.log("server is running on port 5000");
});