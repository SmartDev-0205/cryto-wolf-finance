function beautify(params) {
    let splitdata = params.split(' ');
    return splitdata;
}

function beautify_num(params) {
    let splitdata = params.split('-');
    let firstdata = parseInt(splitdata[0]);
    let data = [];
    let seconddata = splitdata[1] ? splitdata[1] : splitdata[0];
    seconddata = parseInt(seconddata);
    data.push(firstdata);
    data.push(seconddata);
    return data;
}

function filter_attack(params) {
    let res = {
        $and: [{
            attack: {
                $gte: params[0]
            }
        }, {
            attack: {
                $lte: params[1]
            }
        }]
    };
    return res;
}

function filter_defense(params) {
    let res = {
        $and: [{
            defense: {
                $gte: params[0]
            }
        }, {
            defense: {
                $lte: params[1]
            }
        }]
    };
    return res;
}
function filter_health(params) {
    let res = {
        $and: [{
            health: {
                $gte: params[0]
            }
        }, {
            health: {
                $lte: params[1]
            }
        }]
    };
    return res;
}
function filter_pointsOfWolfPack(params) {
    let res = {
        $and: [{
            pointsOfWolfPack: {
                $gte: params[0]
            }
        }, {
            pointsOfWolfPack: {
                $lte: params[1]
            }
        }]
    };
    return res;
}
function filter_wolfPackLife(params) {
    let res = {
        $and: [{
            wolfPackLife: {
                $gte: params[0]
            }
        }, {
            wolfPackLife: {
                $lte: params[1]
            }
        }]
    };
    return res;
}
function filter_gender(params) {
    let res = [];
    if (params.length > 0) {
        let tmp;
        for (let index = 0; index < params.length; index++) {
            tmp = {
                gender: params[index]
            }
            res.push(tmp);
        }
        return {
            $or: res
        };
    } else {
        return res;
    }
}

function filter_breed(params) {
    let res = [];
    if (params.length > 0) {
        let tmp;
        for (let index = 0; index < params.length; index++) {
            tmp = {
                breed: params[index]
            }
            res.push(tmp);
        }
        return {
            $or: res
        };
    } else {
        return res;
    }
}
function filter_level(params) {
    let res = [];
    if (params.length > 0) {
        let tmp;
        for (let index = 0; index < params.length; index++) {
            tmp = {
                level: params[index]
            }
            res.push(tmp);
        }
        return {
            $or: res
        };
    } else {
        return res;
    }
}
exports.beautify = beautify;
exports.beautify_num = beautify_num;

exports.filter_attack = filter_attack;
exports.filter_defense = filter_defense;
exports.filter_health = filter_health;
exports.filter_pointsOfWolfPack = filter_pointsOfWolfPack;
exports.filter_wolfPackLife = filter_wolfPackLife;
exports.filter_gender = filter_gender;
exports.filter_breed = filter_breed;
exports.filter_level = filter_level;