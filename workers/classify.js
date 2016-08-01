function classifyData(datapoints, centers){
  return 	datapoints.map(function(point){
        var distance = centers.map((center) => calcDistance(point,center));
        return distance.indexOf(Math.min(...distance));
      });
}

function calcDistance(pointOne,pointTwo){
  return Math.sqrt(
    zip([pointOne,pointTwo])
    .map((elem) => Math.pow(elem.reduce((prev,current) => prev - current),2))
    .reduce((prev,current) => prev + current)
  );
}

function zip(arrays) {
  return arrays[0].map(function(_,i){
      return arrays.map(function(array){return array[i]})
  });
}

onmessage = function(e) {
  // console.log('classify worker received a message.');
  var workerResult = classifyData(e.data[0], e.data[1]);
  postMessage(workerResult);
}
