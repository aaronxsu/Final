//Get and parse data. Make markers. Store markers inside of the dataset in order to improve the performance
$.ajax(rawChicagoProbs).done(function(data){
  dataChiProbs = JSON.parse(data);
  _.map(dataChiProbs.features, function(datum){
    datum.properties.marker = L.marker([datum.geometry.coordinates[1], datum.geometry.coordinates[0]]);
  });
  console.log(dataChiProbs);
});

$.ajax(rawChicagoCrime2014).done(function(data){
  dataChiCrime = JSON.parse(data);
  _.map(dataChiCrime.features, function(datum){
    datum.properties.marker = L.marker([datum.geometry.coordinates[1], datum.geometry.coordinates[0]]);
  });
  // console.log(dataChiCrime);
});

$.ajax(rawChicagoSanitation2014).done(function(data){
  dataChiSani = JSON.parse(data);
  _.map(dataChiSani.features, function(datum){
    datum.properties.marker = L.marker([datum.geometry.coordinates[1], datum.geometry.coordinates[0]]);
  });
  // console.log(dataChiSani);
});

$.ajax(rawChicagoEnvironment2014).done(function(data){
  dataChiEnv = JSON.parse(data);
  _.map(dataChiEnv.features, function(datum){
    datum.properties.marker = L.marker([datum.geometry.coordinates[1], datum.geometry.coordinates[0]]);
  });
  // console.log(dataChiEnv);
});

$(".sidebar").hide();
$("#clearSearchResult").hide();

/*==============================================================================

Search by dawing a polygon

==============================================================================*/
var layerRemove = function(condition, layer){
  if(condition){
    _.each(layer, function(datum){
      map.removeLayer(datum);
    });
    layer = [];
  }
};

$("#clearSearchResult").click(function(){
  if(mappedGrid){
    map.removeLayer(mappedGrid);
  }
  map.setView([41.8781, -87.834944], 11, {animate: true});
  layerRemove(markerProbs.length, markerProbs);
  layerRemove(markerIsClicked, markerClicked);
  $('#shapes').empty();
  $(".sidebar").hide();
  $("#clearSearchResult").hide();
  $(".leaflet-draw.leaflet-control").show();
  $(".searchboxes").show();
  $('#rank-min').val("");
  $('#rank-max').val("");
  $('#ck-Crime').prop("checked", false);
  $('#ck-Sani').prop("checked", false);
  $('#ck-Envi').prop("checked", false);
});

var sortMarkerAndZoomIn = function(pointsToBeSorted){
  var ptsRanked = _.sortBy(pointsToBeSorted, function(datum){
    return datum.properties.FailRank;
  });
  var markerBounds = L.latLngBounds(
    _.map(ptsRanked, function(datum){
      return [datum.geometry.coordinates[1], datum.geometry.coordinates[0]];
    })
  );
  hexGrid = turf.hexGrid([markerBounds.getWest(), markerBounds.getSouth(), markerBounds.getEast(), markerBounds.getNorth()], 0.15, 'miles');
  hexGridCreated = true;
  map.fitBounds(markerBounds);
  return ptsRanked;
};

var addInfoToSidebarAndInteract = function(ptsRanked){
  _.map(ptsRanked, function(datum){
    var expire = "";
    if(datum.properties.exp == "0"){
      expire = "No";
    }else {
      expire = "Yes";
    }
    var sideBar = '<div class = "shape" id = "'+ datum.properties.License;
    sideBar += '"><p>Name: ' + datum.properties.AKA_Name;
    sideBar += '</b><br>Address: '+ datum.properties.Address + ',Chicago, IL ' + datum.properties.Zip;
    sideBar += '</b><br>Failing Rank: '+ datum.properties.FailRank;
    sideBar += '</b><br>Previous Inspection: '+ datum.properties.count_insp + " times";
    sideBar += '</b><br>Year Built: '+ datum.properties.year_built;
    sideBar += '</b><br>License Expired: '+ expire;
    sideBar += '</p></div>';
    $('#shapes').append(sideBar);
  });

  $('.shape').click(function(){
    var clickedID;
    if(parseInt(this.id)){
      clickedID = this.id;
    }
    layerRemove(markerIsClicked, markerClicked);
    markerClicked = _.chain(ptsRanked).filter(function(datum){
      return datum.properties.License.toString() === clickedID;
    }).map(function(datum){
      var coor = [datum.geometry.coordinates[1], datum.geometry.coordinates[0]];
      map.setView(coor,16, {animate: true});
      markerIsClicked = true;
      return L.marker(coor, {icon: L.divIcon({className: 'clicked-icon'})}).addTo(map);
    }).value();
  });
};

var fillColorAndPlot = function (data){
  //Calculate the breaks for identifying markers with different colors
  var dataCloned = _.clone(data);
  var breaks = [];
  breaks = turf.jenks(dataCloned, 'FailRank', 3);
  //Plot markers in different groups
  if(breaks.length == 4){
    markerProbs = _.map(dataCloned.features, function(datum){
      var rank = datum.properties.FailRank;
      if(rank <= breaks[0]){
        return datum.properties.marker.setIcon(L.divIcon({className: 'icon-first'})).addTo(map);
      }else if(rank > breaks[0] && rank <= breaks[1]){
        return datum.properties.marker.setIcon(L.divIcon({className: 'icon-second'})).addTo(map);
      }else if(rank > breaks[1] && rank <= breaks[2]){
        return datum.properties.marker.setIcon(L.divIcon({className: 'icon-third'})).addTo(map);
      }else{
        return datum.properties.marker.setIcon(L.divIcon({className: 'icon-fourth'})).addTo(map);
      }
    });
    return dataCloned;
  }
};

map.on('draw:created', function (e) {
    $(".sidebar").show();
    $("#clearSearchResult").show();
    $(".searchboxes").hide();
    var layer = e.layer;
    var id = L.stamp(layer);
    var sideBar;
    var polygonLayer;

    //clear Polygon Search
    layerRemove(markerProbs.length, markerProbs);
    $('#shapes').empty();

    //draw Polygon And calculate markers within
    var drawPolygon = {
      "type": "FeatureCollection",
      "features": [layer.toGeoJSON()]
    };
    ptsWithin = turf.within(dataChiProbs, drawPolygon);
    // console.log(ptsWithin);

    var ptsWithinCloned = fillColorAndPlot(ptsWithin);
    //sort Marker And Zoom In
    //add Info To Sidebar And Interact
    addInfoToSidebarAndInteract(sortMarkerAndZoomIn(ptsWithinCloned.features));
});



/*==============================================================================

Search by input and filter

==============================================================================*/
var filterAndPlot = function(){
  if(inputMinComplete && inputMaxComplete){
    ptsWithin = turf.featurecollection(
      _.filter(dataChiProbs.features, function(datum){
        return datum.properties.FailRank >= inputMin && datum.properties.FailRank <= inputMax;
      })
    );
  };
  var ptsWithinCloned = fillColorAndPlot(ptsWithin);
  //sort Marker And Zoom In
  //add Info To Sidebar And Interact
  addInfoToSidebarAndInteract(sortMarkerAndZoomIn(ptsWithinCloned.features));
  $(".sidebar").show();
  $("#clearSearchResult").show();
  $(".leaflet-draw.leaflet-control").hide();
};

var onMinFilterChange = function(){
  inputMinComplete = true;
  inputMin = this.value;
};

var onMaxFilterChange = function(){
  inputMaxComplete = true;
  inputMax = this.value;
  filterAndPlot();
};

var bindEvents = function() {
  $('#rank-min').keyup(onMinFilterChange);
  $('#rank-max').keyup(onMaxFilterChange);
};

$(document).ready(function() {
  bindEvents();
});

/*==============================================================================

Crime, Environmental Complaint, Sanitation Complaint density

==============================================================================*/
var lyrChecked = function(conChecked, data, color, type ){
  if(conChecked){
    if (mappedGrid) {
      map.removeLayer(mappedGrid);
    }
    if(hexGridCreated){
      mappedGrid = L.geoJson(turf.count(hexGrid, data, 'captured'), {
        style: function(feature) {
          return {
            stroke: false,
            fillColor: color,
            fillOpacity: (feature.properties.captured * 0.3)
          };
        },
        onEachFeature: function(feature, layer) {
          // console.log(feature.properties.captured)
          layer.bindPopup(type + " reported: " + feature.properties.captured);
        }
      }).addTo(map);
    }
  }
  else {
    if (mappedGrid) {
      map.removeLayer(mappedGrid);
    }
  }
};

$('#ck-Crime').change(function(){
  var crimeCon = $('#ck-Crime').prop("checked");
  // console.log(crimeCon);
  lyrChecked(crimeCon, dataChiCrime, '#ff0000', 'Crime')
});

$('#ck-Env').change(function(){
  var envCon = $('#ck-Env').prop("checked");
  // console.log(envCon);
  lyrChecked(envCon, dataChiEnv, '#ff4500', 'Environmental Complaint')
});

$('#ck-Sani').change(function(){
  var saniCon = $('#ck-Sani').prop("checked");
  // console.log(saniCon);
  lyrChecked(saniCon, dataChiSani, '#a52a2a', 'Sanitation Complaints')
});
