var sortByLastName = function(a, b){
    return a.last.localeCompare(b.last);
}

var sortByFirsttName = function(a, b){
    return a.first.localeCompare(b.first);
}

var _sortNumber = function(a, b){
    return a.phone.localeCompare(b.phone);
}

var _sortAddress = function(a, b){
    return a.address.localeCompare(b.address);
}




function sortByFirst()
{
    loadItems(sortByFirstName);
}

function sortByLast()
{
    loadItems(sortByLastName);
}

function sortByNumber()
{
    loadItems(_sortByNumber);
}

function sortByAddress()
{
    loadItems(_sortAddress);
}




function deleteClient(first, last, addr){
    var itemToDelete = {
        first: first,
        last: last,
        address: addr
    };
    xhrPost('/api/clients/delete', itemToDelete, function(data){
        console.log(data);
    }, function(err){
        console.log("could not delete volunteer");
    });
}

function loadItems(sortType){
    xhrGet('/api/clients', function(data){
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
        var old_tbody = document.getElementById('clients');
        var new_tbody = document.createElement('tbody');
        new_tbody.id = 'clients';
        for(i = 0; i < items.length; ++i){
            var row = new_tbody.insertRow(i);

            //add name
            var name = row.insertCell(0);
            name.appendChild(document.createTextNode(items[i].first + ' ' + items[i].last));

            //add phone
            var phone = row.insertCell(1);
            phone.appendChild(document.createTextNode(items[i].phone));

            //add email
          //  var email = row.insertCell(2);
            //email.appendChild(document.createTextNode(items[i].email));

            //add schedule
            var schedule = row.insertCell(2);
            schedule.appendChild(document.createTextNode(items[i].address));

            //add edit button
           // var edit = row.insertCell(-1);
            //var link = document.createElement('a');
            //link.href = '/';
            //var text = document.createTextNode('Edit');
            //link.appendChild(text);
            //edit.appendChild(link);

            //add delete button
            var del = row.insertCell(3);
            link = document.createElement('a');
            link.href = '#';
            link.first = items[i].first;
            link.last = items[i].last;
            link.address = items[i].address;
            link.onclick = function(){
                deleteClient(this.first, this.last, this.address);
                setTimeout(loadItems,1000);
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

loadItems(sortByLastName);