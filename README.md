About BLUEPRINT Data Analysis Portal
--------------------------------

The main goal of this project is to create the [BLUEPRINT](http://www.blueprint-epigenome.eu/) data analysis portal software to provide answers beyond the metadata, primary and secondary analysis from the project. 

Wiki
----

Please use the wiki pages to add new use cases, one per page. Please document the use case as much as possible before to start asking for pull requests.

Setup
-----

If you have a custom setup, like having elasticsearch server in a different place, you have to either change [default-config.json](default-config.json) or copy/move it to another path (keeping the `.json` extension) and declare `BLUEPRINT_DATAPORTAL_CONFIG` environment variable with the path for `grunt` calls.

```
BLUEPRINT_DATAPORTAL_CONFIG=/newpath/newconfig.json
export BLUEPRINT_DATAPORTAL_CONFIG
```

The configuration parameters are:

* `esHost`: The host of the Elasticsearch instance as a URL with the path, optionally giving the port.

Installation
-----------

1) Download [Elasticsearch](https://www.elastic.co/downloads/elasticsearch) (versions from 1.7 branch were tested, versions from 2.x branches might work) and extract the content in a folder of the machine which will host it. As Elasticsearch needs LOTS of RAM, we must dedicate at least 24GB for the instance. The latest Java JVM and Elasticsearch versions, the better. In elastichsearc.yml you should set: a `cluster.name` (so the node has its own identity); explicit `http.port` and `transport.tcp.port` (to assure they are always the same); `http.compression` and `http.cors.enabled` to `true`, and `http.cors.allow-origin: "*"``, so it can be queried from everywhere and the results are sent compressed; and setup `script.disable_dynamic: true`

Then run

```
./bin/elasticsearch
```

2) Install [Ruby](https://www.ruby-lang.org/) and [RubyGems](https://rubygems.org/), either using your operating system / distribution package manager, or by hand. Ruby version 1.9.3 (which can be installed in Ubuntu 14.04 as `ruby` or `ruby1.9.1`) and above should be nice. Depending on your system, RubyGems can be installed along with Ruby (as it happens in Ubuntu), or as a separate package.

3) Install [Compass](http://compass-style.org/) (and its dependencies), either using your operating system / distribution package manager, or by hand. Version 1.0.3 and above should work. The installation by hand for the current user is made using RubyGems:

```
gem install --user-install compass
```

In the scenario of installation by hand you have to assure Compass can be reached from the command-line. This is done with the next lines:

```bash
for gemdir in $(gem env gempath | tr ':' ' ') ; do
	PATH="$gemdir/bin:${PATH}"
done
export PATH
```

4) Install latest stable [NodeJs](http://nodejs.org/) release from 0.10 or 0.12 branches, either using your operating system / distribution package manager, or by hand.

(If you have installed NodeJs by hand, remember to add its `bin` subdirectory to the `PATH` environment variable)

5) Clone this repository, and run `npm install`, so [Grunt] (http://gruntjs.com/), [Bower] (http://bower.io/) and other dependencies are installed:

```bash
git clone https://github.com/inab/blueprint-data-portal.git blueprint-www
cd blueprint-www
npm install
```

6) Add `node_modules/.bin` subdirectory to the `PATH` environment variable, so `bower` and `grunt` can be instantiated

```bash
PATH="${PWD}/node_modules/.bin:${PATH}"
export PATH
```

7) Run `grunt build` in order to prepare and deploy the Dataportal site, which will be deployed at `dist` subdirectory. In order to avoid running `grunt` twice, be sure `dist` directory exists before the first run.

```bash
mkdir -p dist
grunt build
```

8) Congratulations! The [DocumentRoot](http://httpd.apache.org/docs/current/mod/core.html#documentroot) of BLUEPRINT Data Analysis Portal is available at the `dist` subdirectory.
