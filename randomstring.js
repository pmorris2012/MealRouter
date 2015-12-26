var makeid = function(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var getRandomInt = function(min,max){
    return Math.floor(Math.random() * (max - min)) + min;
};

module.exports = {
    randstr:makeid,
    randint:getRandomInt
};