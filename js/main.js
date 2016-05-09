var map = L.map('map', {
  center: [41.8781, -87.834944],
  zoom: 11
});
var Stamen_Toner = new L.StamenTileLayer("toner");
map.addLayer(Stamen_Toner);

var drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: true,
    circle: false,
    marker: false,
    rectangle: true
  }
});
drawControl.setPosition('topright');
map.addControl(drawControl);

var rawChicagoProbs = "https://raw.githubusercontent.com/aronxoxo/Final/master/data/2014ChicagoProbs.geojson";
var rawChicagoCrime2014 = "https://raw.githubusercontent.com/aronxoxo/Final/master/data/Crime2014Chicago.geojson";
var rawChicagoSanitation2014 = "https://raw.githubusercontent.com/aronxoxo/Final/master/data/SanitationComplaints2014.geojson";
var rawChicagoEnvironment2014 = "https://raw.githubusercontent.com/aronxoxo/Final/master/data/EnvironmentalComplaint2014.geojson";
var dataChiProbs;
var dataChiCrime;
var markerProbs = [];
var ptsWithin = [];
var inputMin;
var inputMax;
var inputMinComplete = false;
var inputMaxComplete = false;
var markerClicked;
var markerIsClicked = false;
var hexGrid;
var mappedGrid;
var hexGridCreated = false;
