# kmeans-js
A reusable, multi-threaded, functional implementation of the K-Means++ clustering algorithm in JavaScript (ES6) for use directly in the web browser. 

(note: this library uses features only available in ES6)

## Usage:
Import the library with
~~~~
<script src='kmeansJS.js'></script>
~~~~
Then create a new kmeans model passing in your desired options and your data in a matrix format of N rows containing i features.
~~~~
var model = new KMeans({
    k: 3,
    data: data
});
~~~~
### run()
Call the run() method of your model to begin clustering. Your data will be split into chunks handled by seperate threads and the algorithm will attempt to find the minimum heterogeneity cluster assignments given the number of clusters specified. It will return when assignments stabilize across iterations, or when the maximum number of iterations has been reached, whichever is first.
The run() method is asynchronous and requires a callback to be passed as its only argument.
~~~~
model.run(function(result){
    console.log(result)
});
~~~~
After run completion the model will return an object containing the cluster assignment of each datapoint in index order, the location of cluster centroids, and the overall computed heterogeneity for the solution, formated like so:
~~~~
result = {
    data: [a_1, a_2 ... a_N],
    centroids: [[c1_1,c1_2 ... c1_i],[c2_1,c2_2 ... c2_i],[cK ...]],
    heterogeneity: h x 10^m
}
~~~~
Where 'data' is an N dimensional array of cluster assignments index matched to your input data, and centroids is a KxN dimensional matrix of cluster centroid locations.
### classify()
One additional method 'classify()' is available to allow you to use your trained model to classify new data on the fly with very low computational cost. 

Simply call the classify method on an already trained model and pass in a vector with the same dimensionality as the model. An index value representing the assigned cluster is returned synchronously.
~~~~
classifiedPoint = model.classify([0.2, 4, 2.3, ... K]);
// returns an index value of cluster assignment
~~~~

## Options:
Additional options can be passed to kmeans() with the following pattern:
~~~~
options = {
    k: 3,
    data: data,
    maxIterations: 100,
    verbose: true,
}
~~~~
* k: specifies the number of clusters to generate (required)
* data: the matrix of data you wish to classify (required)
* maxIterations: the number of complete iterations through the data the algorithm will make. (optional: default = 100)
* verbose: if set 'true' the data will be logged to the console on each iteration (optional: default = false)
