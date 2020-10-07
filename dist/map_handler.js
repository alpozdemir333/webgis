var baseMapLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
});
var layer = new ol.layer.Tile({
  source: new ol.source.OSM()
});
var center = ol.proj.fromLonLat([32.80737, 39.93789]);
var view = new ol.View({
  center: center,
  zoom: 10
});
var map = new ol.Map({
    target: 'map',
    view: view,
    layers: [layer]
});
var csv=[];
var vectorSource = new ol.source.Vector({
        url:"/api/data",
        format: new ol.format.GeoJSON({ featureProjection: "EPSG:4326" })  
});

var stroke = new ol.style.Stroke({color: 'black', width: 2});
var fill = new ol.style.Fill({color: 'red'});

var markerVectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
        image: new ol.style.RegularShape({
          fill: fill,
          stroke: stroke,
          points: 6,
          radius: 10,
          angle: Math.PI / 6
        })
      })

});

map.addLayer(markerVectorLayer);
var select = new ol.interaction.Select({multiple:false});
select.on('select', fnHandler);
map.addInteraction(select);
map.on("click",handleMapClick);
function handleMapClick(evt)
{
  var coord=ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
  document.getElementById("Latitude").value=coord[1];
  document.getElementById("Longitude").value=coord[0];
}

function fnHandler(e)
{
    var coord = e.mapBrowserEvent.coordinate;
    let features = e.target.getFeatures();
    features.forEach( (feature) => {
      
    
    document.getElementById("tree_type").value=feature.getProperties().tree_type;
    });
    if (e.selected[0])
    {
    var coords=ol.proj.transform(e.selected[0].getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
    document.getElementById("height").value=e.selected[0].getProperties().height;
    document.getElementById("Latitude").value=coords[1];
    document.getElementById("Longitude").value=coords[0];
    
    }
}

function submit()
{
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/post", true);
    xhr.onreadystatechange = function() {
    if(xhr.readyState==4 && xhr.status==200) {
      map.getLayers().forEach(layer => layer.getSource().refresh());
      }
    }
  
    xhr.setRequestHeader('Content-Type', 'application/json');
    var data=JSON.stringify({

        Latitude: document.getElementById('Latitude').value,
        Longitude: document.getElementById('Longitude').value,
        tree_type: document.getElementById('tree_type').value,
        height:document.getElementById('height').value
    });
    xhr.send(data);
    
}


function query()
{
    var params="low="+document.getElementById("low_height").value+"&"+"high="+document.getElementById("high_height").value+"&tree_type="+document.getElementById('tree_query').value;
    var Table = document.getElementById("restable");
      Table.innerHTML = '<thead><tr><th>Tree Type</th><th>Tree Height</th><th>Latitude</th><th>Longitude</th></tr></thead> <tbody id="resbody"> </tbody>'; 
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/query?"+params, true);
    xhr.onreadystatechange = function() {
    if(xhr.readyState==4 && xhr.status==200) {

      var source=
       new ol.source.Vector({
        url:"/query?"+params,
        format: new ol.format.GeoJSON({ featureProjection: "EPSG:4326" })  
      });

      markerVectorLayer.setSource(source);

      map.getLayers().forEach(layer => layer.getSource().refresh());
      var listenerKey = source.on('change', function(e) {
        if (source.getState() == 'ready') {
      
      tablebody=document.getElementById("resbody");
      var features = source.getFeatures();
      csv=[];
      document.getElementById("tpc").innerHTML="Record Count: "+features.length;
      features.forEach( item => {
        let coords = ol.proj.transform(item.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
        let row = tablebody.insertRow();
        let tree_type = row.insertCell(0);
        let tree_height = row.insertCell(1);
        let Latitude = row.insertCell(2);
        let Longitude = row.insertCell(3);
        tree_type.innerHTML= item.getProperties().tree_type;
        tree_height.innerHTML=item.getProperties().height;
        Latitude.innerHTML=coords[1];
        Longitude.innerHTML=coords[0];
       
        let arr=[item.getProperties().tree_type,item.getProperties().height,coords[1],coords[0]];
        csv.push(arr);
      });
    }
  });
      }
    }
  
    xhr.setRequestHeader('Content-Type', 'application/json');
 
    xhr.send(null);
    
}

function exportcsv()
{

  if (csv.length==0)
  {
    return 0;
  }
  let csvContent = "data:text/csv;charset=utf-8," 
    + csv.map(e => e.join(",")).join("\n");


  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "query_results.csv");
  document.body.appendChild(link); // Required for FF
  link.click(); // This will download the data file named "my_data.csv".
}

function discard()
{

  csv=[];
  var Table = document.getElementById("restable");
  Table.innerHTML = '<thead><tr><th>Tree Type</th><th>Tree Height</th><th>Latitude</th><th>Longitude</th></tr></thead> <tbody id="resbody"> </tbody>'; 
  document.getElementById("tpc").innerHTML="Record Count: 0";
  var source=
  new ol.source.Vector({
   url:"/api/data",
   format: new ol.format.GeoJSON({ featureProjection: "EPSG:4326" })  
 });

 markerVectorLayer.setSource(source);

 map.getLayers().forEach(layer => layer.getSource().refresh());
}