function moveCenters(datapoints, centers, assignments){
  return centers.map(function(center, clusterIdx){
    return scalarDivide(
        datapoints // All points
        // filter to points in current group
        .filter((point, dataIdx) => assignments[dataIdx] === clusterIdx)
        // calculate columnwise sum in this group (return value will be divided for avg)
        .reduce((p,c) => vectorAdd(p,c)),datapoints.length);
  });
}

function vectorAdd(arrayOne,arrayTwo){
  return zip([arrayOne,arrayTwo]).map((elem) => elem.reduce((p,c) => p+c));
}

function scalarDivide(arrayOne,scalar){
  return arrayOne.map((elem) => elem / scalar);
}

function zip(arrays) {
  return arrays[0].map(function(_,i){
      return arrays.map(function(array){return array[i]})
  });
}

onmessage = function(e) {
  // console.log('move woker received a message.');
  var workerResult = moveCenters(e.data[0], e.data[1], e.data[2]);
  postMessage([workerResult,e.data[2]]);
}
