About BLUEPRINT Data Portal
---------------------------

The main goal of this project is to create the [BLUEPRINT](http://www.blueprint-epigenome.eu/) data portal software to provide answers beyond the metadata, primary and secondary analysis from the project. 

Wiki
----

Please use the wiki pages to add new use cases, one per page. Please document the use case as much as possible before to start asking for pull requests.

Installation
------------

1) Download [Elasticsearch] (https://www.elastic.co/downloads/elasticsearch) and extract the content in a folder of the machine which will host it. As Elasticsearch needs LOTS of RAM, we must dedicate at least 24GB for the instance. The latest Java JVM and Elasticsearch versions, the better. In elastichsearc.yml you should set: a `cluster.name` (so the node has its own identity); explicit `http.port` and `transport.tcp.port` (to assure they are always the same); `http.compression` and `http.cors.enabled` to `true`, so it can be queried from everywhere and the results are sent compressed; and setup script.disable_dynamic: true

Then run

```
./bin/elasticsearch
```

2) Download and install latest [NodeJs] (http://nodejs.org/) release

(If you have installed NodeJs by hand, remember to add its `bin` subdirectory to the `PATH` environment variable)

3) Download and install [Grunt] (http://gruntjs.com/):

```
npm install -g grunt-cli
```

As this command tries to write in the NodeJs installation directory, if NodeJs was installed as a system package, then this step should be run with more privileges. Alternatively you can run

```
npm install grunt-cli
```

and add `${HOME}/node_modules/.bin` to the `PATH` environment variable.

3) Download and install [Bower] (http://bower.io/), using next:

```
npm install -g bower
```

As this command tries to write in the NodeJs installation directory, if NodeJs was installed as a system package, then this step should be run with more privileges. Alternatively you can run

```
npm install bower
```

and add `${HOME}/node_modules/.bin` to the `PATH` environment variable.

4) Clone this repository, install the dependencies and execute the `grunt` command

```
git clone https://github.com/inab/blueprint.git blueprint-www
cd blueprint-www
# bower install should have been called by *npm install*
# if asks about d3, choose 2
npm install
bower install
```
