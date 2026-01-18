const teamModel = require("../models/team.model");
const productModel = require("../models/product.model");
const jwt = require("jsonwebtoken");

module.exports.addTeam = async (req, res) => {
    try {
        const { teamID, name, members, password } = req.body;
        const hashPassword = await teamModel.hashPassword(password);
        const team = await teamModel.create({
            teamID,
            name,
            members,
            passwordh: hashPassword
        });
        res.status(201).json({ team });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports.teamLogin = async (req, res) => {
    try {
        const { teamID, password } = req.body;
        const team = await teamModel.findOne({ teamID: teamID });
        if (!team) {
            return res.status(400).json({ message: "Invalid teamID or password" });
        }
        const isMatch = await team.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid teamID or password" });
        }
        const token = team.generateAuthToken();
        res.status(200).json({ token });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports.getTeamDetails = async (req, res) => {
    try {
        const team = req.team;
        res.status(200).json({ team });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}

module.exports.getAllTeams = async (req, res) => {
    try {
        const teams = await teamModel.find({});
        res.status(200).json({ teams });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}