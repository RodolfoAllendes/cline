import * as jsPDF from 'jspdf';

import { saveAs } from 'file-saver';

/**
 * Class that provides functionality to export the SVG display from the Canvas
 * Component to image files.
 *
 * The following code, is almost entirely authored by Nikita Rokotyan, and it is
 * used and slightly modified here under the provision given as published under
 * an MIT License. You can get the original code directly from bl.ocks, on the
 * following link:
 *
 * http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
 */
export class Extras{

  public static getSVGString( svgNode: any ):string {
  	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
  	var cssStyleText = this.getCSSStyles( svgNode );

  	this.appendCSS( cssStyleText, svgNode );

  	var serializer = new XMLSerializer();
  	var svgString = serializer.serializeToString(svgNode);
  	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
  	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix
    return svgString;
  }

	public static getCSSStyles( parentElement ) {
	  var selectorTextArr = [];

    // Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (var c = 0; c < parentElement.classList.length; c++)
			if ( !this.contains('.'+parentElement.classList[c], selectorTextArr) )
				selectorTextArr.push( '.'+parentElement.classList[c] );

	  // Add Children element Ids and Classes to the list
	  var nodes = parentElement.getElementsByTagName("*");
	  for (var i = 0; i < nodes.length; i++) {
		  var id = nodes[i].id;
		  if ( !this.contains('#'+id, selectorTextArr) )
			  selectorTextArr.push( '#'+id );

		  var classes = nodes[i].classList;
		  for (var c = 0; c < classes.length; c++)
			  if ( !this.contains('.'+classes[c], selectorTextArr) )
				  selectorTextArr.push( '.'+classes[c] );
	  }

    // Extract CSS Rules
	  var extractedCSSText = "";
	  for (var i = 0; i < document.styleSheets.length; i++) {
		  var s = document.styleSheets[i] as CSSStyleSheet;

		  try {
		    if(!s.cssRules) continue;
		  } catch( e ) {
	      if(e.name !== 'SecurityError') throw e; // for Firefox
	    	continue;
	    }

		  var cssRules = s.cssRules;
      for (var r = 0; r < cssRules.length; r++) {
			  // if ( this.contains( (cssRules[r] as CSSStyleRule).selectorText, selectorTextArr ) )
				  extractedCSSText += cssRules[r].cssText;
		  }
	  }

    return extractedCSSText;
  }

	public static contains(str,arr): boolean {
    // var tokens: string[] = str.split(" ");
		return arr.indexOf( str ) === -1 ? false : true;
	}

  public static appendCSS( cssText, element ) {
	  var styleElement = document.createElement("style");
	  styleElement.setAttribute("type","text/css");
	  styleElement.innerHTML = cssText;
	  var refNode = element.hasChildNodes() ? element.children[0] : null;
	  element.insertBefore( styleElement, refNode );
	}

  public static svgString2Image( svgString, width, height, format, callback ) {
	  var format = format ? format : 'png';
    var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	  var canvas = document.createElement("canvas");
	  var context = canvas.getContext("2d");

	  canvas.width = width;
	  canvas.height = height;

	  var image = new Image();
	  image.onload = function() {
		  context.clearRect ( 0, 0, width, height );
      // draw a white background
      context.fillStyle="#FFFFFF";
      context.fillRect  ( 0, 0, width, height );

      context.drawImage(image, 0, 0, width, height);

        canvas.toBlob( function(blob) {
  			  // var filesize = Math.round( blob.length/1024 ) + ' KB';
  		 	  if ( callback ) callback( blob );//, filesize );
  		  });



	  };
	  image.src = imgsrc;
  }

  public static svgString2Pdf(svgString, width, height){
    var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL
    var canvas = document.createElement("canvas");
	  var context = canvas.getContext("2d");

	  canvas.width = width;
	  canvas.height = height;

	  var image = new Image();
	  image.onload = function() {
		  context.clearRect ( 0, 0, width, height );
      // draw a white background
      context.fillStyle="#FFFFFF";
      context.fillRect  ( 0, 0, width, height );

      context.drawImage(image, 0, 0, width, height);

      var imgData = canvas.toDataURL("image/jpeg", 1.0);

      var doc = new jsPDF("p", "mm", "a4");
      var pdfHeight: number = doc.internal.pageSize.getHeight() -20;
      var pdfWidth: number = width*pdfHeight/height;

      doc.addImage(imgData, 'JPEG', 10, 10, pdfWidth, pdfHeight);
      doc.save("graph.pdf");
	  };
    image.src = imgsrc;
  }

}
