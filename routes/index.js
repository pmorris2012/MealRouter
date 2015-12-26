
/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index.html', { title: 'Cloudant Boiler Plate' });
};

exports.volunteers = function(req, res) {
    res.render('volunteers.html', { title: 'volunteers' });
};

exports.login = function(req, res) {
    res.render('login.html', { title: 'Login' });
};

exports.clients = function(req, res) {
    res.render('clients.html', { title: 'clients' });
};

exports.route = function(req, res) {
    res.render('route.html', { title: 'route' });
};

exports.schedule = function(req, res) {
    res.render('schedule.html', { title: 'schedule' });
};

exports.addvolunteer = function(req, res) {
    res.render('addvolunteer.html', { title: 'addvolunteer' });
};

exports.editvolunteer = function(req, res) {
    res.render('editvolunteer.html', { title: 'editvolunteer' });
};
exports.addclient = function(req, res) {
    res.render('addclient.html', { title: 'addclient' });
};
exports.editclient = function(req, res) {
    res.render('editclient.html', { title: 'editclient' });
};