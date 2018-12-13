var osmium = require('osmium');
var _ = require("lodash")

var count = 0;
var restrictions=0;

var relHandler  = new osmium.Handler();
var geomHandler = new osmium.Handler();

var nodes = []
var nodeLocations = {}
var ways  = []
var wayLocations = {}
var relations = {} //Will just store this in memory after the first pass

var errors = 0

relHandler.on('relation', function(relation) {
  count++;
  if (count%100==0){process.stderr.write("\r"+count)}
    if (relation.tags("type")==='restriction'){
      restrictions++;

      try{

        var members = relation.members();

        if (members.length ){

          var via = members.filter((m)=>{return m.role=='via'})[0]
          var from = members.filter((m)=>{return m.role=='from'})[0]
          var to = members.filter((m)=>{return m.role=='to'})[0]

          if(via){
            if(via.type=='n'){
              nodes.push(via.ref)
              var ref = {'type':'n','ref':via.ref}
            }else if(via.type=='w'){
              ways.push(via.ref)
              var ref = {'type':'w','ref':via.ref}
            }
          }else if(from){
            if(from.type=='n'){
              nodes.push(from.ref)
              var ref = {'type':'n','ref':from.ref}
            }else if(from.type=='w'){
              ways.push(from.ref)
              var ref = {'type':'w','ref':from.ref}
            }
          }else if(to){
            if(to.type=='n'){
              nodes.push(to.ref)
              var ref = {'type':'n','ref':to.ref}
            }else if(to.type=='w'){
              ways.push(to.ref)
              var ref = {'type':'w','ref':to.ref}
            }
          }else{
            if(members[0].type=='n'){
              nodes.push(members[0].ref)
              var ref = {'type':'n','ref':members[0].ref}
            }else if(members[0].type=='w'){
              ways.push(members[0].ref)
              var ref = {'type':'w','ref':members[0].ref}
            }
          }

          relations[relation.id] = {
            i: relation.id,
            u: relation.uid,
            h: relation.user,
            t: relation.timestamp_seconds_since_epoch,
            c: relation.changeset,
            v: relation.version,
            tags: relation.tags(),
            ref: ref
          }
        }
      }catch(e){
        console.warn(e)
      }
    }
});

var nodeCount = 0;
geomHandler.on('node',function(node){
  ++nodeCount;
  if (nodeCount%1000000==0){process.stderr.write("\rread "+nodeCount/1000000+"M nodes, remaining geometries: "+nodes.length+"                 ")}

  if (node.id > curNode){
    while (curNode < node.id){
      console.warn("Node" + curNode + " not in file")
      curNode = nodes.pop()
    }
  }

  if (node.id==curNode){
    nodeLocations[node.id] = node.coordinates

    //last step
    curNode = nodes.pop();

  }
})

var wayCount = 0;
geomHandler.on('way',function(way){
  ++wayCount;
  if (wayCount%1000==0){process.stderr.write("\r"+wayCount/1000+"K ways")}

  if (way.id > curWay){
    while (curWay < node.id){
      console.warn("Way" + curWay + " not in file")
      curWay = nodes.pop()
    }
  }

  if (way.id==curWay){
    var repNode = way.node_refs(0)
    nodes.push( repNode ) //push that node, mark it.

    wayLocations[curWay] = repNode

    //last step
    curWay = ways.pop()
  }
})

geomHandler.on('done', function() {

  //Now matching geometries and creating geojson
  Object.keys(relations).forEach(function(relId){

    try{
      var thisRel = relations[relId]
      var geom;
      if (thisRel.ref.type=='n'){
        geom = {'type':"Point",'coordinates':[nodeLocations[thisRel.ref.ref].lon,nodeLocations[thisRel.ref.ref].lat]}
      }

      if (thisRel.ref.type=='w'){
        repNode = wayLocations[thisRel.ref.ref]
        geom = {'type':"Point",'coordinates':[nodeLocations[repNode].lon, nodeLocations[repNode].lat]}
      }

      var props = thisRel.tags;
      delete props.ref
      props['@id']        = thisRel.i
      props['@user']      = thisRel.h
      props['@uid']       = thisRel.u
      props['@timestamp'] = thisRel.t
      props['@changeset'] = thisRel.c
      props['@version']   = thisRel.v
      props['@tr']        = true

      console.log(JSON.stringify(
        {'type':"Feature",
        "geometry":geom,
        "properties":props}))
    }catch(e){
//       console.warn(JSON.stringify(thisRel,null,2))
//       console.warn(e)
        errors++;
    }
  })

  console.warn("\nFinished, nodes left in nodes array: " + nodes.length)
})


relHandler.on('done', function() {

  //Sort them... and hope that the pbf file is ordered the way we hope it is.
  console.warn(`\rProcessed ${count} relations, found ${restrictions} restrictions`)
  console.warn(`Nodes Involved: ${nodes.length}`)
  console.warn(`Ways Involved:  ${ways.length}`)
  console.warn(`Missing points: ${restrictions - nodes.length - ways.length}\n`);

  nodes = _.uniq(_.sortBy(nodes,function(x){return -Number(x)}));
  ways  = _.uniq(_.sortBy(ways,function(x){return -Number(x)}));

  console.warn(`Nodes Needed: ${nodes.length}`)
  console.warn(`Ways Needed:  ${ways.length}`)

  curNode = nodes.pop();
  curWay = ways.pop();
});

/*
  Runtime
*/

if (!process.argv[2]) {
    console.error('Usage: \n');
    console.error('\tnode extract-geojson-relations.js [OSM FILE] > [GEOJSONSEQ FILE]');
    console.error("\n\n")
    process.exit(1);
}

var input_filename = process.argv[2]


console.warn("----------------------------------------------------------------------")
console.warn("Stage 1: Getting ways / nodes lists from restriction relations\n")

var reader = new osmium.Reader(input_filename, {node: false, way: false, relation:true});
osmium.apply(reader, relHandler);
relHandler.end();
reader.close();

console.warn("----------------------------------------------------------------------")
console.warn("Stage 2: Getting representative NODES for " + ways.length + " ways")
reader = new osmium.Reader(input_filename, {node: false, way: true, relation:false});
osmium.apply(reader, geomHandler);
reader.close();

nodes = _.uniq(_.sortBy(nodes,function(x){return -Number(x)}));
console.warn(`\nNodes Now Needed: ${nodes.length}`)

console.warn("---------------------------------------------------------------------")
console.warn("Stage 3: Getting Node geometries")
reader = new osmium.Reader(input_filename, {node: true, way: false, relation:false});

osmium.apply(reader, geomHandler);
geomHandler.end();
reader.close();

console.warn("Errors: "+errors+ " - most likely relations that only reference other relations...")