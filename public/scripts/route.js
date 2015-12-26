var routeList = document.getElementById('routeList');
var directionsPanel = document.getElementById('directions');
var textArea = document.getElementById('info');
var numToWeekday = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday"
};

var numToMonth = {
    0:"January",
    1:"February",
    2:"March",
    3:"April",
    4:"May",
    5:"June",
    6:"July",
    7:"August",
    8:"September",
    9:"October",
    10:"November",
    11:"December"
}

function dayStringToDate(dayString){
    var vals = dayString.split('-');
    var date = new Date(vals[0], vals[1], vals[2], 23, 59, 59);
    return date;
}

var directionsService;
var directionsDisplay;

function initMap(){
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    console.log(document.getElementById('map'));
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: {lat: 26.34543845, lng: -80.1152055}
    });
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(directionsPanel);
}

function initialize(){
    google.maps.event.addDomListener(window, 'load', function(){
        initMap();
    });
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, routeId){
    var routeToView = {
        route: routeId
    }
    var waypts = [];
    xhrPost('/api/route/view', routeToView, function(data){
        textArea.innerHTML = "Clients:&#13;";
        var origin = data.origin;
        var destination = data.origin;
        var received = data.addresses || [];
        for(var i = 0; i < received.length; ++i){
            waypts.push({
                location: received[i].address,
                stopover: true
            });
            var p = i+1;
            textArea.innerHTML += "name: " + received[i].first + " " + received[i].last + "&#13;" + "phone: " + received[i].phone + "&#13;" + "address: " + received[i].address + "&#13;" + "notes: " + received[i].notes + "&#13;&#13;";
        }
        directionsService.route({
                origin: origin,
                destination: destination,
                waypoints: waypts,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING
            }, function(response, status){
                if(status === google.maps.DirectionsStatus.OK){
                    directionsDisplay.setDirections(response);
                }else{
                    console.log("DIRECTIONS FAILED!!!");
                }
        });
    }, function(err){
        console.log(err);
    });
}

function loadUpcomingRoutes(){
    xhrGet('/api/route', function(data){
        var received = data || [];
        var items = [];
        for(var i = 0; i < received.length; ++i){
            items.push(received[i]);
        }
        for(var i = 0; i < items.length; ++i){
            var date = dayStringToDate(items[i]);
            console.log(items[i]);
            var btn = document.createElement("button");
            btn.dateId = items[i];
            btn.type = "button";
            btn.className = "list-group-item";
            btn.onclick = function(){
                calculateAndDisplayRoute(directionsService, directionsDisplay, this.dateId);
            };
            btn.innerHTML = '<i class="glyphicon glyphicon-map-marker"></i>' + numToWeekday[date.getDay()] + "<br>" + numToMonth[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
            routeList.appendChild(btn);
        }
    },function(err){
        console.log(err);
    })
}

loadUpcomingRoutes();