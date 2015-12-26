var M = document.getElementById("M");
var T = document.getElementById("T");
var W = document.getElementById("W");
var R = document.getElementById("R");
var F = document.getElementById("F");
M.deliver = false;
T.deliver = false;
W.deliver = false;
R.deliver = false;
F.deliver = false;

var startinglocations = document.getElementById("startinglocations");

function loadStartingLocations(){
    xhrGet('/api/schedule/startinglocations', function(data){
        var len = data.slocs.length;
        for(var i = 0; i < len; ++i){
            var opt = document.createElement("option");
            opt.value = data.slocs[i];
            opt.innerHTML = data.slocs[i];
            if(data.slocs[i]===data.selected){
                opt.selected="selected";
                startinglocations.onchange = function(){
                    var objToSend = {
                        starting_location:startinglocations.options[startinglocations.selectedIndex].value
                    }
                    xhrPost('/api/schedule/startinglocations/update', objToSend, function(data){
                        console.log(data);
                    }, function(err){
                        console.log(err);
                    })
                }
            }
            startinglocations.appendChild(opt);
        }
    }, function(err){
        console.log(err);
    });
}

function loadSchedule(){
    xhrGet('/api/schedule', function(data){
        var sched = data.schedule;
        M.className = "btn btn-lg btn-danger";
        T.className = "btn btn-lg btn-danger";
        W.className = "btn btn-lg btn-danger";
        R.className = "btn btn-lg btn-danger";
        F.className = "btn btn-lg btn-danger";
        if(sched.indexOf("M") > -1){
            M.deliver = true;
            M.className = "btn btn-lg btn-success";
        }
        if(sched.indexOf("T") > -1){
            T.deliver = true;
            T.className = "btn btn-lg btn-success";
        }
        if(sched.indexOf("W") > -1){
            W.deliver = true;
            W.className = "btn btn-lg btn-success";
        }
        if(sched.indexOf("R") > -1){
            R.deliver = true;
            R.className = "btn btn-lg btn-success";
        }
        if(sched.indexOf("F") > -1){
            F.deliver = true;
            F.className = "btn btn-lg btn-success";
        }
    },function(err){
        console.log(err);
    });
}

loadSchedule();

loadStartingLocations();

function notifyServer(){
    var sched = "";
    if(M.deliver){
        sched += "M";
    }
    console.log(T.deliver);
    if(T.deliver){
        sched += "T";
    }
    if(W.deliver){
        sched += "W";
    }
    if(R.deliver){
        sched += "R";
    }
    if(F.deliver){
        sched += "F";
    }
    var send = {
        schedule : sched
    }
    console.log(send.schedule);
    xhrPost('/api/schedule/update', send, function(data){
        console.log(data);
    }, function(err){
        console.log(err);
    });
}

function monday(){
    M.deliver = !M.deliver;
    if(M.deliver == false){
        M.className = "btn btn-lg btn-danger";
    }else{
        M.className = "btn btn-lg btn-success";
    }
    notifyServer();
}

function tuesday(){
    T.deliver = !T.deliver;
    if(T.deliver == false){
        T.className = "btn btn-lg btn-danger";
    }else{
        T.className = "btn btn-lg btn-success";
    }
    notifyServer();
}

function wednesday(){
    W.deliver = !W.deliver;
    if(W.deliver == false){
        W.className = "btn btn-lg btn-danger";
    }else{
        W.className = "btn btn-lg btn-success";
    }
    notifyServer();
}

function thursday(){
    R.deliver = !R.deliver;
    if(R.deliver == false){
        R.className = "btn btn-lg btn-danger";
    }else{
        R.className = "btn btn-lg btn-success";
    }
    notifyServer();
}

function friday(){
    F.deliver = !F.deliver;
    if(F.deliver == false){
        F.className = "btn btn-lg btn-danger";
    }else{
        F.className = "btn btn-lg btn-success";
    }
    notifyServer();
}