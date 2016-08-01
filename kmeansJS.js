// ========================================================================
//                  Multi-Threaded K-Means Clustering
// Given a 2 dimensional matrix of data (of arbitrary dimensionality)
// calculates elementwise similarity and groups data into k clusters for
// post-facto classification.
// Created by: Ryan McCullough
// =========================================================================

function KMeans(options) {
  this.k = options.k;
  this.data = options.data;
  this.maxIterations = options.maxIterations;
  this.verbose = options.verbose;
  this.centroids = [];
  this.heterogeneity = 0;
};

KMeans.prototype = {
  constructor: KMeans,

  /* Uses learned cluster centers to classify new data points into a cluster */
  classify: function(point) {
    var self = this;
    // Verify model has already been trained
    if(JSON.stringify(this.centroids) === JSON.stringify([])){
      console.log('Error: classify cannot be used before the model is run!');
      return;
    }
    // Calculate distances from point to each centroid
    var distance = this.centroids.map((center) => this.calcDistance(point,center));
    // Return index of closest centroid
    return distance.indexOf(Math.min(...distance));
  },

  run: function(finalcb) {
    var self = this;
    var debug = false;

    // Run the training alogrithm
    kmeans(this.k,this.data,this.maxIterations,this.verbose,finalcb);

    // Creates threaded workers and begins training
    function kmeans(k, data, maxIterations, verbose, finalcb){
      var previous_classes = []; // Memory of last classification made for testing convergence
      var threads = 2; // Number of web workers desired

      // Create a worker for each desired thread to classify a chunk of data
      // Create a single worker for recentering cluster centroids
      var classifyWorkers = [];
      for (var i = 0; i < threads; i++) {
        var workerX = new Worker('workers/classify.js');
        classifyWorkers.push(workerX);
      }
      var moveWorker = new Worker('workers/move.js');

      // Initialize cluster centers with distance weighted probabilities
      var centroids = smartInit(data,k);

      // begin clustering iterations
      iterate(k,data,maxIterations,finalcb, centroids);

      /* Main function to iterate over data and cluster centers */
      function iterate(k, data, maxIter, callback, centroids=[], assignments=[], iter=0){
        iter++;
        var classified_data = [];
        parallelClassifiers(data, centroids, callback);

        /* Splits the data into buckets and sends buckets to workers for classification.
           When all workers have returned, resulting assignments are sent on to mover
           for recentering of centroids */
        function parallelClassifiers(data, centroids, finalcb){
          var complete = 0;
          var data_buckets = splitData(data);
          for (var i = 0; i < data_buckets.length; i++) {
            classifyWorkers[i].postMessage([data_buckets[i], centroids]);
            classifyWorkers[i].onmessage = function (a){
              complete = complete + 1;
              if(debug){console.log(String(complete) + ' / ' + String(data_buckets.length) + 'complete...');}
              classified_data.push(a.data);

              // If all workers have returned:
              if(complete == (data_buckets.length)){
                if(debug){console.log('all classifiers returned!');}
                classified_data = combineData(classified_data);

                // Check for empty clusters
                var emptyClusters = false;
                for (var i = 0; i < centroids.length; i++) {
                  if(classified_data.indexOf(i) === -1){
                    console.log('empty cluster found.');
                    classified_data = [];
                    centroids[i] = reInitCentroid(data, centroids);
                    emptyClusters = true;
                  }
                }

                // If a cluster was reinitialized, run classification again
                if(emptyClusters){
                  parallelClassifiers(data, centroids, finalcb);
                } else {
                  // Test if convergence has been reached
                  if(JSON.stringify(previous_classes) === JSON.stringify(classified_data)){
                    // End iterations if convergence is true
                    console.log('Ended after ' + String(iter) + ' iterations due to convergence.');
                    self.centroids = centroids;
                    this.heterogeneity = computeHeterogeneity(data, centroids, assignments);
                    finalcb({'data':assignments, 'centroids':centroids, 'heterogeneity':this.heterogeneity});
                  } else {
                    // Send data on to mover worker if convergence has not been reached
                    previous_classes = classified_data;
                    mover(data, centroids, classified_data, finalcb);
                  } // end else
                }// end else
              } // end if
            }; // end onmessage
          } // end for
        } // end parallelClassifiers

        /* Sends centroids and classified data to a worker that moves the centroid
           for each cluster to the center of mass of member points to that cluster */
        function mover(data, centroids, assignments, callback){
          moveWorker.postMessage([data, centroids, assignments]);
          moveWorker.onmessage = function (b){
            if(verbose){
              console.log('------------------------------');
              console.log('Iteration: ' + String(iter));
              console.log('Centroid locations: ');
              console.log(b.data[0]);
              console.log('Assignments: ');
              console.log(b.data[1]);
              console.log('');
            }

            // Test if max iterations has been reached
            if(iter !== (maxIter)){
              // Continue iterating, passing in the previously learned parameters
              iterate(k, data, maxIter, callback, b.data[0], b.data[1], iter);
            } else {
              // End iteration is max number of iterations has been reached
              console.log('Ended after ' + String(iter) + ' iterations due reaching max constraint.');
              self.centroids = centroids;
              this.heterogeneity = computeHeterogeneity(data, centroids, assignments);
              callback({'data':assignments, 'centroids':centroids, 'heterogeneity':this.heterogeneity});
            }
          };
        }

        /* Helper function to split data into buckets */
        function splitData(data){
          var data_clone = data.slice(0);
          partTwo = data_clone.splice(0, (data_clone.length / 2));
          var returnArray = [partTwo,data_clone];
          return returnArray;
        }

        /* Helper function to recombine data buckets */
        function combineData(data){
          var data_clone_zero = data[0].slice(0);
          var data_clone_one = data[1].slice(0);
          for (var i = 0; i < data_clone_one.length; i++) {
            data_clone_zero.push(data_clone_one[i]);
          }
          return data_clone_zero;
        }
      }
    }

    /* Computes the heterogeneity of the clustering. Defined as sum of distances
       from each point to its centroid */
    function computeHeterogeneity(data, centroids, assignments){
      return centroids.map(function(center, clusterIdx){
        return data.filter((point,dataIdx) => assignments[dataIdx] === clusterIdx)
                   .map((point) => calcDistance(point,center))
                   .reduce((p,c) => p+c);
      }).reduce((p,c) => p+c);
    }

    /* Smart initialization of clusters based on 2006 research of Vassilvitskii et. al.
      in 'K-Means++: The advantages of careful seeding'
      http://ilpubs.stanford.edu:8090/778/1/2006-13.pdf */
    function smartInit(data,k){
      var centroids = [];
      centroids[0] = data[Math.floor(Math.random() * data.length)];

      // Get distances to all points and transform them to a probability distribution
      var distances = data.map((point) => calcDistance(point,centroids[0]));
      var weights = scalarDivide(distances, distances.reduce((p,c) => p+c));

      // Iterate k times and pick new points with same probability as obtaining furthest point
      for (var i = 1; i < k; i++) {
        // Generate a list of indexes with a probability distribution proportional to their distance from last point
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

    /* Calculate the euclidean distance from one point to another in arbitrary dimensions */
    function calcDistance(pointOne,pointTwo){
    	return Math.sqrt(
    		zip([pointOne,pointTwo])
    		.map((elem) => Math.pow(elem.reduce((prev,current) => prev - current),2))
    		.reduce((prev,current) => prev + current)
    	);
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
  },

  calcDistance: function(pointOne,pointTwo){
    return Math.sqrt(
      this.zip([pointOne,pointTwo])
      .map((elem) => Math.pow(elem.reduce((prev,current) => prev - current),2))
      .reduce((prev,current) => prev + current)
    );
  },

  zip: function(arrays) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
  }
}
