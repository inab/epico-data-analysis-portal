About EPICO / BLUEPRINT Data Analysis Portal
---------------------------------------

The original goal of this project was to create the [BLUEPRINT](http://www.blueprint-epigenome.eu/) data analysis portal software to provide answers beyond the metadata, primary and secondary analysis from the project. Now, it is being generalized for any data source which is able to implement the [EPICO REST API](https://github.com/inab/EPICO-REST-API)

Setup
-----

If you have a custom setup, like having EPICO REST API server in a different place, you have to either change [default-config.json](default-config.json) or copy/move it to another path (keeping the `.json` extension) and declare `EPICO_DATAPORTAL_CONFIG` environment variable with the path for `grunt` calls.

```
EPICO_DATAPORTAL_CONFIG=/newpath/newconfig.json
export EPICO_DATAPORTAL_CONFIG
```

The configuration parameters are:

* `epicoAPI`: The host of the EPICO REST API as a URL with the path, optionally giving the port.

Installation
-----------

1) Install [Ruby](https://www.ruby-lang.org/) and [RubyGems](https://rubygems.org/), either using your operating system / distribution package manager, or by hand. Ruby version 1.9.3 (which can be installed in Ubuntu 14.04 as `ruby` or `ruby1.9.1`) and above should be nice. Depending on your system, RubyGems can be installed along with Ruby (as it happens in Ubuntu), or as a separate package.

2) Install [Compass](http://compass-style.org/) (and its dependencies), either using your operating system / distribution package manager, or by hand. Version 1.0.3 and above should work. The installation by hand for the current user is made using RubyGems:

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

3) Install latest stable [NodeJs](http://nodejs.org/) release from 0.10 or 0.12 branches, either using your operating system / distribution package manager, or by hand.

(If you have installed NodeJs by hand, remember to add its `bin` subdirectory to the `PATH` environment variable)

4) Clone this repository, and run `npm install`, so [Grunt] (http://gruntjs.com/), [Bower] (http://bower.io/) and other dependencies are installed:

```bash
git clone https://github.com/inab/epico-data-analysis-portal.git epico-data-analysis-portal
cd epico-data-analysis-portal
npm install
```

5) Add `node_modules/.bin` subdirectory to the `PATH` environment variable, so `bower` and `grunt` can be instantiated

```bash
PATH="${PWD}/node_modules/.bin:${PATH}"
export PATH
```

6) Run `grunt build` in order to prepare and deploy the Dataportal site, which will be deployed at `dist` subdirectory. In order to avoid running `grunt` twice, be sure `dist` directory exists before the first run.

```bash
mkdir -p dist
grunt build
```

7) Congratulations! The [DocumentRoot](http://httpd.apache.org/docs/current/mod/core.html#documentroot) of EPICO / BLUEPRINT Data Analysis Portal is available at the `dist` subdirectory.
