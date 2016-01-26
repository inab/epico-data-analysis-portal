Installing the export server
=========================

This directory contains a variation of the PHP based [Highcharts export server](http://www.highcharts.com/docs/export-module/setting-up-the-server) available at [Highcharts Export server repository](https://github.com/highcharts/highcharts-export-server).

This variation depends on:
* [Batik 1.8](https://xmlgraphics.apache.org/batik/)
* [FOP 2.1](https://xmlgraphics.apache.org/fop/2.1/)
* [CairoSVG](http://cairosvg.org/)

Installing FOP 2.1 and Batik 1.8
-----------------------------

1. First, you need to have installed [Apache Ant](http://ant.apache.org/), as well a JDK.

2. Download FOP 2.1, uncompress it and compile the all-in-one transcoder library:

```bash
wget http://apache.rediris.es/xmlgraphics/fop/source/fop-2.1-src.tar.gz
tar xzf fop-2.1-src.tar.gz
cd fop-2.1 && ant transcoder-pkg
```

3. Download Batik 1.8, uncompress it, compile it and replace the bundled all-in-one transcoder library with the compiled one.

```bash
wget http://apache.rediris.es/xmlgraphics/batik/source/batik-src-1.8.tar.gz
tar xzf batik-src-1.8.tar.gz
mv batik-1.8 batik-1.8-src
cd batik-1.8-src && ant jars
mv batik-1.8-src/batik-1.8 .
cp -f fop-2.1/build/fop-transcoder-allinone.jar batik-1.8/lib/fop-transcoder-allinone-1.1.jar
```

4. You need to setup PHP in your server, so it handles requests on /export-server (or the alternate location you choose). If, for instance, `DocumentRoot` has been set up to `/home/blueprint/DOCUMENT_ROOT`, the configuration block would be:

```apache
        <Directory "/home/blueprint/DOCUMENT_ROOT/export-server">
                Options Indexes FollowSymlinks

                DirectoryIndex index.php
                AllowOverride All
                Require all granted
        </Directory>
```

5. By default, [index.php](index.php) assumes batik-1.8 is installed in the same directory as it. If it is setup in a different place, you have to edit [index.php](index.php) file.

Installing CairoSVG
-------------------

CairoSVG is used to curate generated SVG. Ubuntu and many other distributions have CairoSVG among their packages. [index.php](index.php) assumes `cairosvg` executable can be found on `PATH` directories.

Enable local server on data portal deployment
---------------------------------------------
On the configuration file (like default-config.json) you have to setup `useLocalExportServer` key either to `true` or an explicit URL.
