var sortByLastName = function(a, b){
    return a.last.localeCompare(b.last);
}


var sortByFirstName = function(a, b){
return a.first.localeCompare(b.first);
}
var _sortByUser = function(a, b){
return a.user.localeCompare(b.user);
}
var _sortByPhone = function(a, b){
return a.phone.localeCompare(b.phone);
}
var _sortByEmail = function(a, b){
return a.email.localeCompare(b.email);
}




function deleteVolunteer(idToDelete){
    var itemToDelete = {
        user: idToDelete
    };
    xhrPost('/api/volunteers/delete', itemToDelete, function(data){
        console.log(data);
		
    }, function(err){
        console.log("could not delete volunteer");
    });
}





function loadItems(sortType){
    xhrGet('/api/volunteers', function(data){
        var received = data || [];
        var items = [];
        var i = 0;
        for(i = 0; i < received.length; i++){
            var item = received[i];
            if(item && 'id' in item){
                items.push(item);
            }
        }
        items.sort(sortType);
        var old_tbody = document.getElementById('volunteers');
        var new_tbody = document.createElement('tbody');
        new_tbody.id = 'volunteers';
        for(i = 0; i < items.length; ++i){
            var row = new_tbody.insertRow(i);

            //add username
            var user = row.insertCell(0);
            user.appendChild(document.createTextNode(items[i].user));

            //add name
            var name = row.insertCell(1);
            name.appendChild(document.createTextNode(items[i].first + ' ' + items[i].last));

            //add phone
            var phone = row.insertCell(2);
            phone.appendChild(document.createTextNode(items[i].phone));

            //add email
            var email = row.insertCell(3);
            email.appendChild(document.createTextNode(items[i].email));

            //add schedule
            var schedule = row.insertCell(4);
            schedule.appendChild(document.createTextNode(items[i].schedule));

            //add edit button
         //   var edit = row.insertCell(5);
            //var link = document.createElement('a');
            //link.href = '/';
            //var text = document.createTextNode('Edit');
            //link.appendChild(text);
            //edit.appendChild(link);

            //add delete button
            var del = row.insertCell(5);
            link = document.createElement('a');
            link.href = '#';
            link.user = items[i].user;
            link.onclick=function(){
                deleteVolunteer(this.user);
                //setTimeout(function(){loadItems(sortByLastName);},1000);
                setTimeout(function(){location.reload();}, 1000);
            };
            text = document.createTextNode('Delete');
            link.appendChild(text);
            del.appendChild(link);
        }
        old_tbody.parentNode.replaceChild(new_tbody, old_tbody);
    }, function(err){
        console.log(err);
    },
    function(err){
        console.log('could not get volunteers from database');
    });
}

function AddItem(){
    //temporary. replace these 'example' values with
    //values user enters into a popup 'add volunteer' form
    user = {
        id:"example",
        user:"example",
        pass:"examplepass",
        phone:"123",
        first:"exam",
        last:"ple",
        email:"ex@ample.com",
        schedule:"MWF"
    };
    xhrPut('/api/volunteers/add', user, function(err, response){

    },
    function(err){
        console.log('could not add item - already exists');
    });
}




function sortByEmail()
{
    loadItems(_sortByEmail);
}

function sortByPhone()
{
    loadItems(_sortByPhone);
}

function sortByUser()
{
    loadItems(_sortByUser);
}

function sortByFirst()
{
    loadItems(sortByFirstName);
}

function sortByLast()
{
    loadItems(sortByLastName);
}






loadItems(sortByLastName);