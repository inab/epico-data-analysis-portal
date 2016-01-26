<?php
/**
 * This file is part of the exporting module for Highcharts JS.
 * www.highcharts.com/license
 * 
 *  
 * Available POST variables:
 *
 * $filename  string   The desired filename without extension
 * $type      string   The MIME type for export. 
 * $width     int      The pixel width of the exported raster image. The height is calculated.
 * $svg       string   The SVG source code to convert.
 */


// Options
define ('BATIK_PATH', 'batik-1.8/batik-rasterizer-1.8.jar');

///////////////////////////////////////////////////////////////////////////////
ini_set('magic_quotes_gpc', 'off');

$type = $_POST['type'];
$svg = (string) $_POST['svg'];
$filename = (string) $_POST['filename'];

// prepare variables
if (!$filename or !preg_match('/^[A-Za-z0-9\-_ ]+$/', $filename)) {
	$filename = 'chart';
}
if (get_magic_quotes_gpc()) {
	$svg = stripslashes($svg);	
}

// check for malicious attack in SVG
if(strpos($svg,"<!ENTITY") !== false || strpos($svg,"<!DOCTYPE") !== false){
	exit("Execution is stopped, the posted SVG could contain code for a malicious attack");
}

$tempName = md5(rand());

// allow no other than predefined types
if ($type == 'image/png') {
	$typeString = '-m image/png';
	$ext = 'png';
	
} elseif ($type == 'image/jpeg') {
	$typeString = '-m image/jpeg';
	$ext = 'jpg';

} elseif ($type == 'application/pdf') {
	$typeString = '-m application/pdf';
	$ext = 'pdf';

} elseif ($type == 'image/svg+xml') {
	$ext = 'transcoded.svg';
	$typeString = '';
} else { // prevent fallthrough from global variables
	$ext = 'txt';
}

$svgfile = sys_get_temp_dir() . "/$tempName.svg";
$outfile = sys_get_temp_dir() . "/$tempName.$ext";
$errfile = sys_get_temp_dir() . "/$tempName.err";

// Assuring the files do not exist
unlink($svgfile);
unlink($outfile);
unlink($errfile);

if (isset($typeString)) {
	
	// size
	$width = '';
	if ($_POST['width']) {
		$width = (int)$_POST['width'];
		if ($width) $width = "-w $width";
	}

	// generate the temporary file
	if (!file_put_contents($svgfile, $svg)) { 
		die("Couldn't create temporary file. Check that the directory permissions for
			the /temp directory are set to 777.");
	}
	
	// Troubleshooting snippet
	/*
	$command = "/Library/Java/JavaVirtualMachines/jdk1.7.0_45.jdk/Contents/Home/bin/java -jar ". BATIK_PATH ." $typeString -d $outfile $width temp/$tempName.svg 2>&1"; 
	$output = shell_exec($command);
	echo "<pre>Command: $command <br>";
	echo "Output: $output</pre>";
	die;
	// */

	// Do the conversion
	if($typeString == '') {
		$output = shell_exec("cairosvg $svgfile -o $outfile 2> $errfile");
	} else {
		$output = shell_exec("java -Djava.awt.headless=true -jar ". BATIK_PATH ." $typeString -d $outfile $width $svgfile 2> $errfile");
	}
	
	// catch error
	$dontRemove = false;
	if (!is_file($outfile) || filesize($outfile) < 10) {
		// $dontRemove = true;
		echo "<pre>$output</pre>";
		echo "Error while converting SVG. ";
		
		if (strpos($output, 'SVGConverter.error.while.rasterizing.file') !== false) {
			echo "
			<h4>Debug steps</h4>
			<ol>
			<li>Copy the SVG:<br/><textarea rows=5>" . htmlentities(str_replace('>', ">\n", $svg)) . "</textarea></li>
			<li>Go to <a href='http://validator.w3.org/#validate_by_input' target='_blank'>validator.w3.org/#validate_by_input</a></li>
			<li>Paste the SVG</li>
			<li>Click More Options and select SVG 1.1 for Use Doctype</li>
			<li>Click the Check button</li>
			</ol>";
		}
	} 
	
	// stream it
	else {
		header("Content-Disposition: attachment; filename=\"$filename.$ext\"");
		header("Content-Type: $type");
		//echo file_get_contents($outfile);
		readfile($outfile);
	}
	
	if(!$dontRemove) {
		// delete it
		unlink($svgfile);
		unlink($outfile);
		unlink($errfile);
	}

// SVG can be streamed directly back
} else if ($ext == 'svg') {
	header("Content-Disposition: attachment; filename=\"$filename.$ext\"");
	header("Content-Type: $type");

	echo $svg;
	
} else {
	echo "Invalid type";
}
?>
