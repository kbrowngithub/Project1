var firebaseConfig = {
    apiKey: "AIzaSyDlFw-SrUXQdgRDqUvTkPZcwQm-tgIIgAw",
    authDomain: "hipsters-paradise.firebaseapp.com",
    databaseURL: "https://hipsters-paradise.firebaseio.com",
    projectId: "hipsters-paradise",
    storageBucket: "hipsters-paradise.appspot.com",
    messagingSenderId: "343184641394",
    appId: "1:343184641394:web:45d963e7f2ac119f2421eb"
};
firebase.initializeApp(firebaseConfig);
database = firebase.database();


function getMapData(search) {
    var url = "https://nominatim.openstreetmap.org/?format=json&limit=1&addressdetails=1&countrycodes=US&q="
    var queryTerm = '';
    for (let i = 0; i < search.length; i++) {
        if (search[i] === ' ') {
            queryTerm += '+';
        } else {
            queryTerm += search[i].toLowerCase();
        }
    }
    $.ajax({
        type: "GET",
        url: url + queryTerm,
        success: function (response) {
            if (response[0] !== undefined && response[0].address.city) {
                console.log(response);
                var city = response[0].address.city;
                //var postcode = response[0].address.postcode;
                var state = response[0].address.state;
                var lat = response[0].lat;
                var lon = response[0].lon;

                database.ref('search').push({
                    searchTerm: search,
                    city: city,
                    //postcode: postcode,
                    state: state,
                    lat: lat,
                    lon: lon
                });
                findSuggest(lat + "," + lon);
            } else {
                console.log(response);
                console.log('Incorrect search');
                findSuggest(0);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
}

$('#getLocation').on('click', function () {
    navigator.geolocation.getCurrentPosition(function (position) {
        getMapData(position.coords.latitude + ',' + position.coords.longitude);
    });
});

$("#search").keypress(function (event) {
    if (event.which == 13) {
        event.preventDefault();
        validateAddress($("#search").val());
        $("tbody").empty();
        getMapData($("#search").val());
    }
});

function findSuggest(coordinates) {
    if (coordinates === 0) {
        showVenues(0);
    }
    else {
        $.ajax({
            type: "GET",
            url: "https://app.ticketmaster.com/discovery/v2/suggest.json?latlong=" + coordinates + "&apikey=G8wASZPn3DFcYGef4xr5K2DUzqvDxQJ2",
            async: true,
            dataType: "json",
            success: function (json) {
                console.log(JSON.stringify(json));
                showVenues(json);
            },
            error: function (xhr, status, err) {
                console.log(err);
            }
        });
    }
}

function showVenues(json) {
    if (json !== 0 && json._embedded.venues !== undefined) {
        var events = json._embedded.venues;
        console.log(events);

        for (var i = 0; i < events.length; i++) {
            console.log(JSON.stringify(events[i]));
            var newRow = $("<tr>").append(
                $("<td><a href=\"" + events[i].url + "\" style=\"display:block;\">" + events[i].name + "</a></td>")
            );
            $("#events > tbody").append(newRow);
        }
    }
    else {
        var newRow = $("<tr>").append(
            $("<td>0 Events Found</td>")
        );
        $("#events > tbody").append(newRow);
    }
}

var modal = document.getElementById("myModal");
var modalJQ = $("#myModal");

function validateAddress(address) {
    var addr;
    var city;
    var state;

    if (address !== undefined && address !== null) {
        if (address.indexOf(",") !== -1) {
            addr = address.split(",");
        }
        else {
            addr = address.split(" ");
        }
        state = addr.pop().trim();
        city = addr.join(" ").trim();
        console.log("City = " + city);
        console.log("State = " + state);

        $.ajax({
            type: "GET",
            url: "https://us-zipcode.api.smartystreets.com/lookup?auth-id=022252ec-6053-af31-55a2-1c8da629fa60&auth-token=f54PmDZdC6YfHW71XSFZ&city=" + city + "&state=" + state.trim(),
            async: true,
            dataType: "json",
            success: function (json) {
                console.log(JSON.stringify(json));

                if (json[0].status === "blank" || json[0].status === "invalid_state" || json[0].status === "invalid_city") {
                    console.log("json[0].status = " + json[0].status);
                    console.log("json[0].reason = " + json[0].reason);
                    // Get the modal
                    $(".modal-content").text(json[0].reason);
                    modal.style.display = "block";

                }

            },
            error: function (xhr, status, err) {
                console.log(err);
            }
        });
    }
    else {
        console.log("Invalid city/state");
    }
}

//
// Modal code
//

var searchId = $("#search");
function removeModal(searchId) {
    modal.style.display = "none";
    searchId.empty();
    searchId.attr("placeholder", "test 'Denver, CO'");
}

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    removeModal();
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        removeModal();
    }
}
