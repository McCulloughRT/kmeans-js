/* Main function to iterate over data and cluster centers */
function kmeans(data, k=3, maxIterations=10, verbose=false){
  var assignments = [];
  var centroids = smartInit(data,k);
  console.log(centroids);
  console.log(assignments);
  for (var i = 0; i < maxIterations; i++) {
    // Classify the data based on distance to centers:
    var original_assignments = assignments;
    assignments = classifyData(data, centroids);
    for (var j = 0; j < centroids.length; j++) {
      centroids[j]
      if(assignments.indexOf(j) === -1){
        // We have an empty cluster, delete it and re-initialize
        console.log('empty cluster');
        centroids[j] = reInitCentroid(data,centroids);
        assignments = classifyData(data, centroids);
      }
    }
    // Move the cluster centers to in-class means:
    centroids = moveCenters(data, centroids, assignments);
    // Print updates if requested:
    if(verbose){
      console.log('------------------------------');
      console.log('Iteration: ' + String(i));
      console.log('Centroid locations: ');
      console.log(centroids);
      console.log('Assignments: ');
      console.log(assignments);
      console.log('');
    }
  }

  /* Calculates the summed heterogeneity of each cluster. Use to trigger end of optimization */
  function computeHeterogeneity(data, assignments, centroids){
    // TODO: implement heterogeneity calculation
  }

  /* Smart initialization of clusters based on 2006 research of Vassilvitskii et. al.
    in 'K-Means++: The advantages of careful seeding'
    http://ilpubs.stanford.edu:8090/778/1/2006-13.pdf */
  function smartInit(data,k){
    // Randomly pick point from dataset to be first center:
    var centroids = [];
    centroids[0] = data[Math.floor(Math.random() * data.length)];

    // Get distances to all points and transform them to a probability distribution
    var distances = data.map((point) => calcDistance(point,centroids[0]));
    var weights = scalarDivide(distances, distances.reduce((p,c) => p+c));

    // Iterate k times and pick new points with same probability as obtaining furthest point
    for (var i = 1; i < k; i++) {
      // Generate a list of indexes with a probability distribution proportional
      // to their distance from last point
      var weightedList = generateWeightedList([...Array(data.length).keys()], weights);
      // Randomly select an index from that list
      var idx = weightedList[randomIndex(weightedList.length)];
      // set the new centroid to be the datapoint with the selected index
      centroids[i] = data[idx];
      // update distances and weights
      distances = minDistanceToCentroid(data, centroids);
      weights = scalarDivide(distances, distances.reduce((p,c) => p+c));
    }
    return centroids;
  }

  /* When centroids run out of members, re-initialize randomly with probability
    proportional to distances */
  function reInitCentroid(datapoints, centroids){
    var distances = minDistanceToCentroid(datapoints, centroids);
    var weights = scalarDivide(distances, distances.reduce((p,c) => p+c));
    var weightedList = generateWeightedList([...Array(datapoints.length).keys()], weights);
    var idx = weightedList[randomIndex(weightedList.length)];
    return datapoints[idx];
  }

  /* For each datapoint, calculate the minimum distance to a centroid */
  function minDistanceToCentroid(datapoints, centroids){
    return datapoints.map(function(point){
      var distances = centroids.map((center) => calcDistance(point, center));
      return Math.min(...distances);
    });
  }

  /* Given a list of items, and an array of probabilities, generate a new
    list of items with distribution equal to probability */
  function generateWeightedList(list,weights){
    var weighed_list = [];
    for (var i = 0; i < weights.length; i++) {
      var multiples = weights[i] * 100;
      for (var j = 0; j < multiples; j++) {
        weighed_list.push(list[i]);
      }
    }
    return weighed_list;
  }

  /* Generate a random number corresponding to an index in an array */
  function randomIndex(max){
    return Math.floor(Math.random() * (max +1));
  }

  /* For each datapoint, find distance to closest centroid and return that centroid's
    index value as a cluster assignment */
  function classifyData(datapoints, centers){
    return 	datapoints.map(function(point){
          var distance = centers.map((center) => calcDistance(point,center));
          return distance.indexOf(Math.min(...distance));
        });
  }

  /* Move each centroid to the center of mass of it's assigned data points */
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

  /* Calculate the euclidean distance from one point to another in arbitrary dimensions */
  function calcDistance(pointOne,pointTwo){
    return Math.sqrt(
      zip([pointOne,pointTwo])
      .map((elem) => Math.pow(elem.reduce((prev,current) => prev - current),2))
      .reduce((prev,current) => prev + current)
    );
  }

  /* Helper function for element-wise addition of two n-dimensional vectors */
  function vectorAdd(arrayOne,arrayTwo){
    return zip([arrayOne,arrayTwo]).map((elem) => elem.reduce((p,c) => p+c));
  }

  /* Helper function for diving a vector by a scalar */
  function scalarDivide(arrayOne,scalar){
    return arrayOne.map((elem) => elem / scalar);
  }

  /* Helper function to zip lists together, similar to python zip functionality */
  /* eg: zip([[0,2,4],[1,3,5]]) => [[0,1],[2,3],[4,5]] */
  function zip(arrays) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
  }

  return {'data':assignments,'centroids':centroids};
}
