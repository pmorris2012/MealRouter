/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), user = require('./routes/user'), http = require('http'), path = require('path'), fs = require('fs'), passport = require('passport'), expressSession = require('express-session');
var randomstring = require('./randomstring'), kmeans = require('./samesizekmeans');
var app = express();
var maps = require('googlemaps/lib/index');

var config = {
    key: "AIzaSyChXBF7J8xMw59lGT7yy62ZzcJeI_71v6M",
    google_client_id: 'mealrouter',
    stagger_time: 1000,
    encode_polylines: false,
    secure: true
};
var gmAPI = new maps();

function geocodeParamTemplate(){
    var template = {
        "components":"components=country:US",
        "bounds":"26.335565,-80.308243|26.968721,-80.033895",
        "language":"en",
        "region":"US"
    };
    return template;
}

var db_volunteers;
var db_clients;
var db_routes;
var db_starting_locations;

var cloudant;

var fileToUpload;

var dbCredentials = {
	dbName : 'my_sample_db'
};

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));
app.use(expressSession({secret: 'CEN4010'}));
app.use(passport.initialize());
app.use(passport.session());

// development only
if ('development' == app.get('env')) {
	app.use(errorHandler());
}

var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
    //done(null, user._id);
    console.log(user._id);
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    /*
    User.findById(id, function(err, user) {
        done(err, user);
    });
    */
    db_volunteers.get(id, {revs_info: true}, function(err, user) {
        done(err, user);
    })
});

function isVolunteer(doc){
    if(doc.auth){
        return false;
    }
    return true;
}

passport.use('login', new LocalStrategy({
    passReqToCallback : true
    },
    function(req, username, password, done) {
        console.log("logging in");
        var found = false;
        db_volunteers.get(username, {revs_info: true}, function(err, user){
            console.log("got result from DB");
            if (err) {
                console.log("ERROR HERE?");
                return done(null, false);
            }
            if (!user){
                console.log('User Not Found with username '+username);
                return done(null, false);
            }
            if (user.pass != password){
                console.log('Invalid Password');
                return done(null, false);
            }
            console.log("success!");
            return done(null, user);
        });
    }
));

function initDBConnection() {
	
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;

			cloudant = require('cloudant')(dbCredentials.url);
			
			// check if DB exists if not create
			cloudant.db.create(dbCredentials.dbName, function (err, res) {
				if (err) { console.log('could not create db ', err); }
		    });

			
		} else {
			console.warn('Could not find Cloudant credentials in VCAP_SERVICES environment variable - data will be unavailable to the UI');
		}
	} else{
		console.warn('VCAP_SERVICES environment variable not set - data will be unavailable to the UI');
		// For running this app locally you can get your Cloudant credentials 
		// from Bluemix (VCAP_SERVICES in "cf env" output or the Environment 
		// Variables section for an app in the Bluemix console dashboard).
		// Alternately you could point to a local database here instead of a 
		// Bluemix service.
		dbCredentials.host = "c4a3fd9c-240e-414f-abb3-ca2fdbd4f36c-bluemix.cloudant.com";
		dbCredentials.port = 443;
		dbCredentials.user = "c4a3fd9c-240e-414f-abb3-ca2fdbd4f36c-bluemix";
		dbCredentials.password = "b4b09a3cffae943b3b0918e60f3c61a214e2b813ff0785edc2cfc718e8817a5c";
		dbCredentials.url = "https://c4a3fd9c-240e-414f-abb3-ca2fdbd4f36c-bluemix:b4b09a3cffae943b3b0918e60f3c61a214e2b813ff0785edc2cfc718e8817a5c@c4a3fd9c-240e-414f-abb3-ca2fdbd4f36c-bluemix.cloudant.com";
		cloudant = require('cloudant')(dbCredentials.url);
	}
}

initDBConnection();

db_volunteers = cloudant.use("volunteers");
db_clients = cloudant.use("clients");
db_routes = cloudant.use("routesv2");
db_starting_locations = cloudant.use("starting_locations");

app.get('/', routes.login);

app.post('/login', passport.authenticate('login', {
            successRedirect: '/redirect',
            failureRedirect: '/'}));

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

function loggedIn(req, res, next){
    if(req.user){
        next();
    }else{
        res.redirect('/');
    }
}

app.get('/redirect', loggedIn, function(req, res){
    db_volunteers.get(req.user._id, { revs_info: true }, function(err, doc){
        if(err){
            console.log(err);
        }else{
            if(doc.auth){
                res.redirect('/volunteers');
            }else{
                res.redirect('/route');
            }
        }
    });
});

app.get('/volunteers', loggedIn, routes.volunteers);
app.get('/clients', loggedIn, routes.clients);
app.get('/route', loggedIn, routes.route);
app.get('/schedule', loggedIn, routes.schedule);
app.get('/addvolunteer', loggedIn, routes.addvolunteer);
app.get('/addclient', loggedIn, routes.addclient);
app.get('/editvolunteer', loggedIn, routes.editvolunteer);
app.get('/editclient', loggedIn, routes.editclient);

//ROUTE PLANNING FUNCTIONS

function dateToDayString(date){
    return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
}

function dayStringToDate(dayString){
    var vals = dayString.split('-');
    var date = new Date(vals[0], vals[1], vals[2], 23, 59, 59);
    return date;
}

var numToWeekday = {
    1: "M",
    2: "T",
    3: "W",
    4: "R",
    5: "F"
};

function deleteOldRoutes(){
    console.log("deleting old routes");
    db_routes.list(function(err, body){
        if(!err){
            var len = body.rows.length;
            body.rows.forEach(function(document){
                var date = dayStringToDate(document.id);
                var now = new Date();
                if(now.getTime() > date.getTime()){
                    db_routes.get(document.id, { revs_info: true }, function(err, doc){
                        if(!err){
                            db_routes.destroy(doc._id,doc._rev,function(err, body){
                                if(err) {
                                    console.log('Delete failed');
                                    res.status(500);
                                    res.send(err);
                                }else{
                                    console.log("deleted route: " + doc._id);
                                }
                            });
                        }else{
                            console.log(err);
                        }
                    });
                }
            });
        }else{
            console.log(err);
        }
    });
}

function getAllItemsInVolunteers(next, next2, next3, today){
    var itemList = [];
    var j = 0;
    db_volunteers.list(function(err, body) {
        console.log("getting volunteers..." + today.getTime());
        if (!err) {
            var len = body.rows.length;
            body.rows.forEach(function(document) {
                db_volunteers.get(document.id, { revs_info: true }, function(err, doc) {
                    if (!err) {
                        itemList.push(doc);
                        j++;
                        if(j >= len){
                            next(next2, next3, itemList, today);
                        }
                    } else {
                        console.log(err);
                    }
                });

            });
        } else {
            console.log(err);
        }
    });
    return itemList;
}

function getAllItemsInClients(next, next2, volunteers, today){
    var itemList = [];
    var j = 0;
    db_clients.list(function(err, body) {
        console.log("getting clients..." + today.getTime());
        if (!err) {
            var len = body.rows.length;
            body.rows.forEach(function(document) {
                db_clients.get(document.id, { revs_info: true }, function(err, doc) {
                    if (!err) {
                        itemList.push(doc);
                        j++;
                        if(j >= len){
                            next(next2, volunteers, itemList, today);
                        }
                    } else {
                        console.log(err);
                    }
                });

            });
        } else {
            console.log(err);
        }
    });
    return itemList;
}

function getAllItemsInStartingLocations(next, volunteers, clients, today){
    var itemList = [];
    var j = 0;
    db_starting_locations.list(function(err,body){
        if(!err){
            var len = body.rows.length;
            body.rows.forEach(function(document){
                db_starting_locations.get(document.id, {revs_info: true}, function(err, doc){
                    if(!err){
                        itemList.push(doc);
                        j++;
                        if(j >= len){
                            next(volunteers, clients, itemList, today);
                        }
                    }else{
                        console.log(err);
                    }
                });
            });
        }else{
            console.log(err);
        }
    });
    return itemList;
}

function clustering(points, k){
    var bestScore = 100000000;
    var clusters = "";
    console.log("k means clustering...");
    for(var l = 0; l < 100; ++l){
        console.log("run: " + l);
        var clustersObj = kmeans.run(points,k);
        var score = clustersObj.score;
        console.log(score);
        if(score < bestScore || clusters === ""){
            clusters = clustersObj.clusters;
        }
    }
    return clusters;
}

function computeRoutes(_volunteersList, clientsList, startingLocationsList, today){
    var volunteersList = [];
    for(var j = 0; j < _volunteersList.length; ++j){
        if(_volunteersList[j].schedule.indexOf(numToWeekday[today.getDay()]) > -1 && isVolunteer(_volunteersList[j])){
            volunteersList.push(_volunteersList[j]);
        }
    }
    var k = volunteersList.length;
    var points = [];
    var pointsToClients = {};
    console.log("assembling dictionary of lat/lng points to clients" + today.getTime());
    for(var j = 0; j < clientsList.length; ++j){
        var pointString = clientsList[j].lat.toString() + clientsList[j].lng.toString();
        pointsToClients[pointString] = j;
        points.push([clientsList[j].lat, clientsList[j].lng]);
    }
    var starting_locations = [];
    var starting_locationsToClients = {};
    var starting_locationsToVolunteers = [];
    console.log("assembling dictionary of lat/lng points to starting locations");
    for(var j = 0; j < startingLocationsList.length; ++j){
        var pointString = startingLocationsList[j].lat.toString() + startingLocationsList[j].lng.toString();
        starting_locationsToClients[pointString] = j;
        starting_locations.push([startingLocationsList[j].lat, startingLocationsList[j].lng]);
        var objToPush = {
            sloc: pointString,
            volunteers: []
        };
        for(var k = 0; k < volunteersList.length; ++k){
            if(volunteersList[k].starting_location === startingLocationsList[j].address){
                objToPush.volunteers.push(volunteersList[k]);
            }
        }
        starting_locationsToVolunteers.push(objToPush);
    }
    var splitResult = kmeans.split(points, starting_locations);
    var clusters = [];
    for(var j = 0; j < splitResult.length; ++j){
        var slocstring = splitResult[j].starting_location[0].toString() + splitResult[j].starting_location[1].toString();
        var slocVolunteersList = "";
        for(var k = 0; k < starting_locationsToVolunteers.length; ++k){
            if(slocstring === starting_locationsToVolunteers[k].sloc){
                slocVolunteersList = starting_locationsToVolunteers[k].volunteers;
            }
        }
        var newk = slocVolunteersList.length;
        var clusteringResult = clustering(splitResult[j].points, newk);
        clusters.push({
            starting_location: splitResult[j].starting_location,
            cluster: clusteringResult
        });
    }

    console.log("assembling output of clustering");
    var _id = dateToDayString(today);
    var route = {
        _id: _id,
        date: _id,
        routes: []
    };
    for(var j = 0; j < clusters.length; ++j){
        var slocstring = clusters[j].starting_location[0].toString() + clusters[j].starting_location[1].toString();
        var subRoute = {
            starting_location: startingLocationsList[starting_locationsToClients[slocstring]],
            route: []
        };
        var slocVolunteersList = "";
        for(var k = 0; k < starting_locationsToVolunteers.length; ++k){
            if(slocstring === starting_locationsToVolunteers[k].sloc){
                slocVolunteersList = starting_locationsToVolunteers[k].volunteers;
            }
        }
        for(var k = 0; k < clusters[j].cluster.length; ++k){
            var subsubRoute = {
                user: slocVolunteersList[k]._id,
                waypoints: []
            };
            for(var l = 0; l < clusters[j].cluster[k].length; ++l){
                var pointString = clusters[j].cluster[k][l][0].toString() + clusters[j].cluster[k][l][1].toString();
                var client = clientsList[pointsToClients[pointString]];
                var waypoint = {
                    address:client.address,
                    lat:client.lat,
                    first:client.first,
                    last:client.last,
                    phone:client.phone,
                    notes:client.notes,
                    lng:client.lng};
                subsubRoute.waypoints.push(waypoint);
            }
            subRoute.route.push(subsubRoute);
        }
        route.routes.push(subRoute);
    }
    console.log("inserting new cluster into database...");
    db_routes.get(_id, {revs_info:true}, function(err, doc){
        if(!err) {
            route._rev = doc._rev;
        }
        console.log("ROUTE PLANNED!!!");
        console.log(route);
        db_routes.insert(route, function(err, result){
            if(err){
                console.log("ERROR: ROUTE COULD NOT BE INSERTED!!!");
            }else{
                console.log(result);
            }
        });
    });
}

function planRoutes(){
    console.log("ROUTE PLANNING:")
    deleteOldRoutes();
    var today = new Date();
    for(var i = 0; i < 7; ++i){
        if(today.getDay() > 0 && today.getDay() < 6){
            var date = new Date(today.getTime());
            getAllItemsInVolunteers(getAllItemsInClients, getAllItemsInStartingLocations, computeRoutes, date);
        }
        today.setDate(today.getDate() + 1);
    }
}

//planRoutes();

//VOLUNTEERS API

app.post('/api/volunteers/add', function(req, res){
    db_starting_locations.list(function(err,body){
        if (!err) {
            var len = body.rows.length;
            var rand = randomstring.randint(0,len);
            var docId = body.rows[rand].id;
            var newUser = {
                _id:req.body.user,
                user:req.body.user,
                pass:req.body.pass,
                phone:req.body.phone,
                first:req.body.first,
                last:req.body.last,
                email:req.body.email,
                schedule:"",
                starting_location:docId
            };
            if(req.body.auth){
                newUser.auth = "admin";
            }
            if(req.body.scheduleM === "M"){
                newUser.schedule = newUser.schedule.concat("M");
            }
            if(req.body.scheduleT === "T"){
                newUser.schedule = newUser.schedule.concat("T");
            }
            if(req.body.scheduleW === "W"){
                newUser.schedule = newUser.schedule.concat("W");
            }
            if(req.body.scheduleR === "R"){
                newUser.schedule = newUser.schedule.concat("R");
            }
            if(req.body.scheduleF === "F"){
                newUser.schedule = newUser.schedule.concat("F");
            }
            console.log(newUser);
            db_volunteers.get(newUser._id, { revs_info: true }, function(err, doc) {
                if(err){
                    db_volunteers.insert(newUser, function(err, result){
                        if(err){
                            res.status(500);
                            res.send(err);
                        }
                        res.status(200);
                        planRoutes();
                    });
                }
                else{
                    res.status(500);
                    res.send(err);
                }
            });
        }else{
            console.log(err);
        }
    });
});

app.post('/api/volunteers/delete', function(req, res){
    console.log("Delete volunteer invoked");
    var _id = req.body.user;
    db_volunteers.get(_id, { revs_info: true }, function(err, doc) {
        if(err){
            console.log("Delete failed");
            res.status(500);
            res.send(err);
        }else{
            var _rev = doc._rev;
            db_volunteers.destroy(_id,_rev,function(err, body){
                if(err){
                    console.log('Delete failed');
                    res.status(500);
                    res.send(err);
                }
            });
            res.status(200);
            planRoutes();
        }
    });
});

app.get('/api/volunteers', function(request,response){
    console.log("Get volunteers invoked.. ");
    var docList = [];
    var i = 0;
    db_volunteers.list(function(err, body) {
        if (!err) {
            var len = body.rows.length;
            console.log('total # of volunteers -> '+len);
            body.rows.forEach(function(document) {
                db_volunteers.get(document.id, { revs_info: true }, function(err, doc) {
                    if (!err) {
                        var responseData = {
                            id:doc._id,
                            user:doc.user,
                            pass:doc.pass,
                            phone:doc.phone,
                            first:doc.first,
                            last:doc.last,
                            email:doc.email,
                            schedule:doc.schedule
                        };
                        if(isVolunteer(doc)){
                            docList.push(responseData);
                        }
                        i++;
                        if(i >= len) {
                            response.write(JSON.stringify(docList));
                            console.log('ending response...');
                            response.end();
                        }
                    } else {
                        console.log(err);
                    }
                });

            });
        } else {
            console.log(err);
        }
    });
});

//CLIENTS API

app.post('/api/clients/add', function(req, res){
    var newUser = {
        _id:randomstring.randstr(10),
        phone:req.body.phone,
        first:req.body.first,
        last:req.body.last,
        address:req.body.address,
        email:req.body.email,
        notes:req.body.notes
    };
    console.log(newUser);
    var geocodeParams = geocodeParamTemplate();
    geocodeParams.address = req.body.address;
    gmAPI.geocode(geocodeParams, function(err, result){
        if(err){
            console.log("address could not be found in google maps")
            res.status(500);
            res.send(err);
        }else{
            console.log(result.results[0]);
            newUser.lat = result.results[0].geometry.location.lat;
            newUser.lng = result.results[0].geometry.location.lng;
            newUser.address = result.results[0].formatted_address;
            db_clients.get(newUser._id, { revs_info: true }, function(err, doc) {
                if(err){
                    db_clients.insert(newUser, function(err, result){
                        if(err){
                            res.status(500);
                            res.send(err);
                        }
                        res.status(200);
                        planRoutes();
                    });
                }
                else{
                    res.status(500);
                    res.send(err);
                }
            });
        }
    });
});

app.post('/api/clients/delete', function(req, res){
    console.log("Delete client invoked");
    db_clients.list(function(err, body){
        if(err){
            console.log(err);
        }else{
            body.rows.forEach(function(document){
                db_clients.get(document.id, {revs_info:true}, function(err, doc){
                    console.log(doc.address);
                    console.log(req.body.address);
                    if(doc.address.localeCompare(req.body.address) === 0){
                        db_clients.destroy(doc._id, doc._rev, function(err, body){
                            if(err) {
                                console.log("Delete failed.");
                                res.status(500);
                                res.send(err);
                            }
                            res.status(200);
                            planRoutes();
                        });
                    }
                });
            });
        }
    });
});

app.get('/api/clients', function(request,response){
    console.log("Get clients invoked.. ");
    var docList = [];
    var i = 0;
    db_clients.list(function(err, body) {
        if (!err) {
            var len = body.rows.length;
            console.log('total # of clients -> '+len);
            body.rows.forEach(function(document) {

                db_clients.get(document.id, { revs_info: true }, function(err, doc) {
                    if (!err) {
                        var responseData = {
                            id:doc._id,
                            phone:doc.phone,
                            first:doc.first,
                            last:doc.last,
                            address:doc.address,
                            email:doc.email,
                            notes:doc.notes
                        };
                        docList.push(responseData);
                        i++;
                        if(i >= len) {
                            response.write(JSON.stringify(docList));
                            console.log('ending response...');
                            response.end();
                        }
                    } else {
                        console.log(err);
                    }
                });

            });
        } else {
            console.log(err);
        }
    });
});

//SCHEDULE API

app.get('/api/schedule', function(request, response){
    console.log("get schedule invoked");
    db_volunteers.get(request.user._id, {revs_info:true}, function(err, doc){
        if(err){
            console.log(err);
        }else{
            var doctoreturn = {
                schedule: doc.schedule
            }
            response.write(JSON.stringify(doctoreturn));
            console.log("ending response");
            response.end();
        }
    });
});

app.post('/api/schedule/update', function(request, response){
    console.log("update schedule invoked");
    db_volunteers.get(request.user._id, {revs_info: true}, function(err, doc){
        if(err){
            console.log(err);
            response.status(500);
            response.send(err);
        }else{
            doc.schedule = request.body.schedule;
            db_volunteers.insert(doc, function(err,result){
                if(err){
                    console.log(err);
                    response.status(500);
                    response.send(err);
                }else{
                    console.log("success");
                    response.status(200);
                    planRoutes();
                }
            });
        }
    });
});

app.get('/api/schedule/startinglocations', function(request, response){
    console.log("get starting locations invoked");
    db_volunteers.get(request.user._id, {revs_info:true}, function(err, doc){
        if(err){
            console.log(err);
        }else{
            var docToSend = {
                selected: doc.starting_location,
                slocs: []
            };
            db_starting_locations.list(function(err, body){
                var len = body.rows.length;
                var i = 0;
                body.rows.forEach(function(document){
                    docToSend.slocs.push(document.id);
                    i++;
                    if(i >= len){
                        response.write(JSON.stringify(docToSend));
                        console.log("ending response");
                        response.end();
                    }
                });
            });
        }
    });
});

app.post('/api/schedule/startinglocations/update', function(request, response){
    console.log("updating starting location for " + request.user._id);
    db_volunteers.get(request.user._id, {revs_info:true}, function(err, doc){
        if(err){
            console.log(err);
            response.status(500);
            response.send();
        }else{
            doc.starting_location = request.body.starting_location;
            db_volunteers.insert(doc, function(err, result){
                if(err){
                    console.log(err);
                    response.status(500);
                    response.send();
                }else{
                    console.log("success");
                    response.status(200);
                    planRoutes();
                }
            })
        }
    });
});

//ROUTE API

app.get('/api/route', function(request, response){
    console.log("get routes invoked");
    var dateList = [];
    var i = 0;
    db_volunteers.get(request.user._id, {revs_info: true}, function(err, doc){
        if(err){
            console.log(err);
        }else{
            db_routes.list(function(err, body){
                if(!err){
                    body.rows.forEach(function(document){
                        var date = dayStringToDate(document.id);
                        i++;
                        if(doc.schedule.indexOf(numToWeekday[date.getDay()]) > -1){
                            dateList.push(document.id);
                        }
                        if(i >= body.rows.length){
                            response.write(JSON.stringify(dateList));
                            console.log("ending response");
                            response.end();
                        }
                    });
                }
            });
        }
    });
});

app.post('/api/route/view', function(request,response){
    console.log(request.user._id + "has requested to view a route on " + request.body.route);
    db_routes.get(request.body.route, {revs_info:true}, function(err,doc){
        if(err){
            console.log(err);
        }else{
            for(var i = 0; i < doc.routes.length; ++i){
                for(var j = 0; j < doc.routes[i].route.length; ++j){
                    if(doc.routes[i].route[j].user === request.user._id){
                        var objToReturn = {
                            addresses: doc.routes[i].route[j].waypoints,
                            origin: doc.routes[i].starting_location.address
                        };
                        response.write(JSON.stringify(objToReturn));
                        console.log("ending response");
                        response.end();
                    }
                }
            }
        }
    })
});

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
