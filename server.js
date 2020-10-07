const express = require("express");
const pg=require("pg").Pool;
const bodyParser = require('body-parser'); 
const app = express();
const pool=new pg({host:'ec2-46-137-124-19.eu-west-1.compute.amazonaws.com',database:'d5cqv028134sa',user:'jlrviwxlaucoak',password:'9c2ee239cabc4e8f844244817b966ed759fc34678316e1f40cc36d3e656b7dd3',port:'5432', ssl: {
    rejectUnauthorized: false
  }});
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json()); 
const _port = process.env.PORT || 5000;
const _app_folder = __dirname + '/dist' ;
app.use(express.static(__dirname + '/dist' ));

var table_name="trees";
app.get("/api/data",function(req,res)
{
    pool.query("SELECT jsonb_build_object('type','FeatureCollection','features', jsonb_agg(feature)) FROM (SELECT jsonb_build_object('type','Feature','geometry',ST_AsGeoJSON(geom)::jsonb, 'properties', to_jsonb(row) - 'gid' - 'geom') AS feature  FROM (SELECT * FROM "+table_name+") row) features;", (err1, res1) => 
        {   
            if(err1) {return console.log(err1);}
            res.json(res1.rows[0]["jsonb_build_object"]);                  
        });         
});

app.post('/post', function(request, response){
    pool.query("INSERT INTO "+table_name+" VALUES('"+request.body.tree_type+"','"+request.body.height+"',ST_SETSRID(ST_MAKEPOINT("+request.body.Longitude+","+request.body.Latitude+"),4326));", (err1, res1) => 
        {        
            if(err1) 
                {   console.log(request.body);
                    return console.log(err1);}
                response.statusCode = 200;
                response.setHeader('Content-Type', 'text/plain');
                response.end('Data Store Success!\n');      
        }); 
});

app.get("/query",function(req,res)
{
    var low=req.query.low;
    var high=req.query.high;
    var tree_type=req.query.tree_type;
    var query="";
    if (tree_type=="ALL")
    {
        query="SELECT jsonb_build_object('type','FeatureCollection','features', jsonb_agg(feature)) FROM (SELECT jsonb_build_object('type','Feature','geometry',ST_AsGeoJSON(geom)::jsonb, 'properties', to_jsonb(row) - 'gid' - 'geom') AS feature  FROM (SELECT * FROM "+table_name+" WHERE height BETWEEN '"+low+"' AND '"+high+"')row) features;";
    }
    else
    {
        query="SELECT jsonb_build_object('type','FeatureCollection','features', jsonb_agg(feature)) FROM (SELECT jsonb_build_object('type','Feature','geometry',ST_AsGeoJSON(geom)::jsonb, 'properties', to_jsonb(row) - 'gid' - 'geom') AS feature  FROM (SELECT * FROM "+table_name+" WHERE (height BETWEEN '"+low+"' AND '"+high+"') AND (tree_type='"+tree_type+"')) row) features;";
    }
    //SELECT jsonb_build_object('type','FeatureCollection','features', jsonb_agg(feature)) FROM (SELECT jsonb_build_object('type','Feature','geometry',ST_AsGeoJSON(geom)::jsonb, 'properties', to_jsonb(row) - 'gid' - 'geom') AS feature  FROM (SELECT * FROM trees WHERE (height BETWEEN '0' AND '100') and (tree_type='Çam')) row) features;
    pool.query(query, (err1, res1) => 
        {   
            if(err1) {return console.log(err1);}
            res.json(res1.rows[0]["jsonb_build_object"]);                  
        });         
});



app.all('*', function (req, res) {
    res.status(200).sendFile(`/`, {root: _app_folder});
});

app.listen(_port, function () {
    console.log("Node Express server for " + app.name + " listening on http://localhost:" + _port);
});