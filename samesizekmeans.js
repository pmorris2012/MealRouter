//ARRAY REMOVAL BY VALUE - http://stackoverflow.com/questions/3954438/remove-item-from-array-by-value
function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

//ARRAY SHUFFLE IN PLACE
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

//POINT CLASS - HOLDS X AND Y COORDINATES
function Point(X, Y, k){
    this.x = X;
    this.y = Y;
    this.mean = -1;
    this.distances = [];
    for(var i = 0; i < k; ++i){
        this.distances.push(0)
    }
    this.closest = -1;
    this.closestDist = 100000000;
    this.farthest = -1;
    this.farthestDist = -1;
}

Point.prototype.dist = function(p){
    return Math.sqrt(Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2));
};

function distance(p1, p2){
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

//CLUSTER CLASS - HOLDS POSITION AND LIST OF POINTS
function Cluster(X, Y, name){
    this.x = X;
    this.y = Y;
    this.name = name;
    this.points = [];
}

function computeDistances(pts, mns, clstrSize){
    for(var i = 0; i < pts.length; ++i){
        pts[i].closestDist = 100000000;
        pts[i].farthestDist = -1;
        for(var j = 0; j < mns.length; ++j){
            if(mns[j].points.length < clstrSize){
                pts[i].distances[j] = pts[i].dist(mns[j]);
                if(pts[i].distances[j] <= pts[i].closestDist){
                    pts[i].closestDist = pts[i].distances[j];
                    pts[i].closest = j;
                }
                if(pts[i].distances[j] >= pts[i].farthestDist){
                    pts[i].farthestDist = pts[i].distances[j];
                    pts[i].farthest = j;
                }
            }
        }
        if(pts[i].closest == -1){
            console.log("ERROR");
        }
    }
}

var kmeans;
//pts - a list of [x, y] lists of points
//k - number of means to group the points into
kmeans = function (pts, k) {
    var n = pts.length;
    k = k * 1.0;
    var clusterSize = Math.ceil(n / k);
    points = [];
    for(var i = 0; i < n; ++i) {
        points.push(new Point(pts[i][0], pts[i][1], k));
    }
    shuffleArray(points);
    clusters = [];
    for(var i = 0; i < k; ++i) {
        clusters.push(new Cluster(points[i].x, points[i].y, i));
        clusters[i].points.push(points[i]);
        points[i].mean = clusters[i].name;
    }
    var done = false;
    while(!done){
        computeDistances(points, clusters, clusterSize);
        var ordered = [];
        for(var i = 0; i < points.length; ++i){
            if(points[i].mean == -1){
                ordered.push(points[i]);
            }
        }
        ordered = ordered.sort(/**
         * @return {number}
         */
        function SortByDiff(a, b){
            var diff1 = a.farthestDist - a.closestDist;
            var diff2 = b.farthestDist - b.closestDist;
            return (diff1 < diff2) ? 1 : (diff1 > diff2) ? -1 : 0;
        });
        for(var i = 0; i < ordered.length; ++i){
            if(clusters[ordered[i].closest].points.length < clusterSize){
                clusters[ordered[i].closest].points.push(ordered[i]);
                ordered[i].mean = ordered[i].closest;
            }
        }
        if(ordered.length == 0){
            done = true;
        }

    }
    var retObj = [];
    var score = 0.0;
    for(var i = 0; i < clusters.length; ++i){
        var pts = [];
        var subscorex = 0.0;
        var subscorey = 0.0;
        var minx = 1000, maxx = -1000, miny = 1000, maxy = -1000;
        for(var j = 0; j < clusters[i].points.length; ++j){
            var pt = [];
            if(clusters[i].points[j].x > maxx){
                maxx = clusters[i].points[j].x;
            }
            if(clusters[i].points[j].x < minx){
                minx = clusters[i].points[j].x;
            }
            if(clusters[i].points[j].y > maxy){
                maxy = clusters[i].points[j].y;
            }
            if(clusters[i].points[j].y < miny){
                miny = clusters[i].points[j].y;
            }
            pt.push(clusters[i].points[j].x);
            pt.push(clusters[i].points[j].y);
            pts.push(pt);
        }
        subscorex = maxx - minx;
        subscorey = maxy - miny;
        score += subscorex + subscorey;
        retObj.push(pts);
    }
    retObj2 = {
        clusters: retObj,
        score: score
    }
    return retObj2;
};

var splitPoints;

splitPoints = function(pts, slocs){
    var objToReturn = [];
    for(var i = 0; i < slocs.length; ++i){
        objToReturn.push({
            starting_location: slocs[i],
            points: []
        });
    }
    for(var i = 0; i < pts.length; ++i){
        var closest = objToReturn[0].starting_location;
        var closestDist = 10000000000;
        for(var j = 0; j < objToReturn.length; ++j){
            var dist = distance(pts[i], objToReturn[j].starting_location);
            if(dist < closestDist){
                closest = objToReturn[j].starting_location;
                closestDist = dist;
            }
        }
        for(var j = 0; j < objToReturn.length; ++j){
            if(objToReturn[j].starting_location === closest){
                objToReturn[j].points.push(pts[i]);
            }
        }
    }
    return objToReturn;
}

module.exports = {
    run: kmeans,
    split: splitPoints
};