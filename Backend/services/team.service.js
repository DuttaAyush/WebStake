const teamModel = require('../models/team.model');


module.exports.createTeam = async ({
    teamID,name,members,password,
}) => {
    if (!teamID ||!name ||!members || !password) {
        throw new Error('All fields are required');
    }
    const team = teamModel.create({
        teamID,
        name,
        members,
        password
    });

    return team;
}