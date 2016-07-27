# kmeans-js
A reusable implementation of the K-Means++ clustering algorithm in JavaScript (ES6).

## Usage:
Import the library with
~~~~
<script src='kmeansJS.js'></script>
~~~~
Then call the kmeans function with a set of data in matrix format of N rows containing i features.
~~~~
var model = kmeans(data);
~~~~
## Return:
After run completion the kmeans() function will return an object containing the location of cluster centroids, and the cluster assignment of each datapoint in index order, formated like so:
~~~~
model = {
    data: [a_1, a_2 ... a_N],
    centroids: [[c1_1,c1_2 ... c1_i],[c2_1,c2_2 ... c2_i],[cK ...]]
}
~~~~
Where 'data' is an N dimensional array of cluster assignments index matched to your input data, and centroids is a KxN dimensional matrix of cluster centroid locations.

## Options:
Additional arguments can be passed to kmeans() with the following pattern:
~~~~
kmeans(data, k=3, maxIterations=10, verbose=false)
~~~~
* k=N: specifies the number of clusters to generate (default = 3)
* maxIterations: the number of complete iterations through the data the algorithm will make. (default = 10)
* verbose: if set 'true' the assignments and centroids will be logged to the console on each iterations (default = false)
