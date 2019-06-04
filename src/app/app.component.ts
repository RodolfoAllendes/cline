import * as d3 from 'd3';

import { ViewChild } from '@angular/core';
import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { Dendrogram } from './dendrogram';
import { Utils } from './utils';
import { Extras } from './extras';
import { ClusterMatchEnum } from './clusterMatchType';
import { CanvasComponent } from './canvas/canvas.component';
import { InterfaceComponent } from './interface/interface.component';
import { saveAs } from 'file-saver';

/**
 * Component definition
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
/**
 * Main Application Component
 * Handles the interaction needed between the Interface Component - which
 * provides an interface to the user and captures its interactions; with the
 * Canvas Component - that deals with the display of Dendrograms and the
 * calculation of matches between them.
 */
export class AppComponent {
  /** The list of dendrograms currently loaded in the application */
  private _dendrograms: Dendrogram[] = [];
  /** Title for the Application */
  private _title: string = "Dendrogram (Sub)Cluster Match Visualization System";

  /** link to the canvas element where the visualization takes place */
  @ViewChild('canvas', {static: false}) _canvas: CanvasComponent;
  /** link to the interface component */
  @ViewChild('interface', {static: false}) _interface: InterfaceComponent;

  /**
   * Handle the changing of higlighting options for edges in matching sub-
   * clusters.
   *
   * @param {string} type The type of edge highlighting selected by the user
   */
  public onChangeHighlightType(type: string): void{
    this._canvas.updateMatchHighlight(type);
    this._canvas.drawScene(this._interface.getDisplayMatches());
  }

  /**
   * Handle changes in the type of sub-cluster marches that should be displayed
   * by the application.
   *
   * Since the matching routine is based on the names of the internal nodes of
   * the Dendrogram structure, the first step into updating the display is to
   * re-name the nodes. Then, clusters matches are re-calculated anf finally
   * displayed.
   *
   * @param {number} type The type of matching strategy selected by the user
   */
  public onChangeMatchType(type: number): void{
    // depending on the type of cluster matching algorithm, we change the
    // parameters used for the label generation
    // Isomorphic - keep struct.: true;  keep duplicates: true
    // Rearranged - keep struct.: false; keep duplicates: true
    // Contained  - keep struct.: false; keep duplicates: false
    var keepStructure: boolean = (type === ClusterMatchEnum.BIOISOMORPHIC) ? true : false;
    var keepDuplicate: boolean = (type === ClusterMatchEnum.CONTAINED) ? false : true;
    for(var i:number = 0; i<this._dendrograms.length; ++i){
      this._dendrograms[i].setLabels(keepStructure, keepDuplicate);
    }
    // update the list of cluster matches that we need to display
    this._canvas.updateClusterMatches(this._interface.getSampleSize());
    // redraw the scene to reflect changes
    this._canvas.drawScene(this._interface.getDisplayMatches());
  }

  /**
   * Handle the change in the cutoff for a single Dendrogram.
   *
   * The change in the cutoff implies changing the amount of nodes that can take
   * part of the matching routine, thus in turn it calls for an update on the
   * node's labels, and an update on the cluster matching calculation.
   *
   * @param {number} id The index of the Dendrogram whose cutoff was changed
   */
  public onChangeCutoff(id: number):void{
    var type: number = this._interface.getMatchType();
    console.log("changecutoff matchtype?:", type);
    var keepStructure: boolean = (type === ClusterMatchEnum.BIOISOMORPHIC) ? true : false;
    var keepDuplicate: boolean = (type === ClusterMatchEnum.CONTAINED) ? false : true;

    this._dendrograms[id].setLabels(keepStructure, keepDuplicate);

    // update the list of cluster matches that we need to display
    this._canvas.updateClusterMatches(this._interface.getSampleSize());
    // redraw the scene to reflect changes
    this._canvas.drawScene(this._interface.getDisplayMatches());
  }

  /**
   * Handle the change in sample size for cluster matching.
   *
   * The sample size tells the application the minimum number of leaves a node
   * has to have in order to be classified as non-trivial for the matching
   * algorithm.
   *
   * When considered trivial, a node will not be included in the matching
   * routine, and thus will not be paired to a similar node in a different
   * structure, even if it meets the currently selected criteria for such match
   * to occur.
   *
   * @param {number} size The new size for sample, that should be used when
   * calculating matching nodes across Dendrogram structures
   */
  public onChangeSampleSize(size: number): void{
    // Update the list of matches, using the new size for trivial nodes
    this._canvas.updateClusterMatches(size);
    // redraw the scene to reflect changes
    this._canvas.drawScene(this._interface.getDisplayMatches());
  }

  /**
   * Handle the horizonal flip of a single Dendrogram display.
   *
   * Dendrograms are usually shown with their root node at the left-end of the
   * display, and the leaves at the right-end. But in order to facilitate the
   * visual inspection of cluster matches, the user is allowed to flip this
   * visualization, making the leaves display at the left-end, and the root at
   * the right-end.
   *
   * @param {number} id The index of the Dendrogram the user has selected to flip
   */
  public onFlipDendrogram(id: number): void{
    this._dendrograms[id].toggleFlipped();
    this._canvas.initDendrogramCoordinates(id);
    this._canvas.drawScene(this._interface.getDisplayMatches());
  }

  /**
   * Handle the loading of a Dendrogram structure and its display.
   *
   * Dendrograms need to be stored on text files, following the Newick (or New)
   * Hampshire) format.
   *
   * @param {file} file The file object where the Dendrogram is stored, supplied
   * by the user
   */
  public onLoadDendro(file: any): void{

    // title for the new dendrogram and initialization of a new instance
    var fileName: string;
    fileName = file.name;
    fileName = Utils.rsplit(fileName, ".", 1)[0];
    var d: Dendrogram;
    d = new Dendrogram(fileName);

    // url object for file reading and processing
    var url = URL.createObjectURL(file);
    var self = this;
    // define a variable that can be uses to exchange data between the page
    // and the server
    var rqst = new XMLHttpRequest();
    // request the files
    rqst.open("GET", url);
    // since the loading of the files is performed asynchronously by AJAX, we
    // wait for both to be ready before performing the callback. Since loading
    // of either file finishes first, we when the 'second' loading finishes
    rqst.onreadystatechange = function() {
      // rqst DONE and status OK
      if (rqst.readyState == 4 && rqst.status == 200) {
        var info = rqst.responseText.trim();
        // remove first and last parenthesis and semicolon at the end of line
        info = info.substring(1,info.length-1);

        // loading the text file into a hierarchical structure for D3 involves
        // two stages: parsing into a suitable object structure
        var dendro = Utils.parsePhylogramTree(info, "r");
        // and create a hierarchical layout for d3
        d.setRoot(d3.hierarchy(dendro));

        // post-processing of the dendrogram structure
        d.getRoot().count();  // calculates the # of children each node has
        d.initLeafCount(); // initialize the number of leaves in the dendrogram
        d.setDistance(); // calculate the distance from each node to its leaves
        d.setLeafLabels(); // modify the label of leaves

        // assign labels to internal nodes
        var type: number = +self._interface.getMatchType();
        var keepStructure: boolean = (type === ClusterMatchEnum.BIOISOMORPHIC) ? true : false;
        var keepDuplicate: boolean = (type === ClusterMatchEnum.CONTAINED) ? false : true;
        d.setLabels(keepStructure, keepDuplicate);

        // finally, we handle the drawing of the scene
        // add the structure to the list
        self._dendrograms.push(d);
        // rezize the canvas to accomodate the new struct
        self._canvas.updateSize();
        // update all dendro coordinates
        self._canvas.initDendrogramCoordinates();
        // if needed for display, update list of cluster matches
        if( self._interface.getDisplayMatches ){
          self._canvas.updateClusterMatches(self._interface.getSampleSize());
        }
        // redraw the whole scene
        self._canvas.drawScene(self._interface.getDisplayMatches());
      }
    }
    rqst.send();
  }

  /**
   * Handle the removal of a Dendrogram from the display.
   *
   * @param {number} index The index of the Dendrogram selected for removal
   */
  public onRemoveDendro(id: any): void{
    this._dendrograms.splice(id, 1);
    this._canvas.updateSize();
    this._canvas.initDendrogramCoordinates();
    this._canvas.updateClusterMatches(this._interface.getSampleSize()); // update list of cluster matches
    this._canvas.drawScene(this._interface.getDisplayMatches());
  }

  /**
   * Handle the request for saving the current canvas into a PDF file.
   *
   * @param {any} event The click event generated by the button element of the
   * interface
   */
  public onSavePDF(event: any): void{
    var svg: any = this._canvas.getDisplay();
    var width: number = this._canvas.getWidth();
    var height: number = this._canvas.getHeight();
    var svgString:string = Extras.getSVGString(svg.node());
    // passes Blob and filesize String to the callback
    Extras.svgString2Pdf( svgString, width, height );
  }

  /**
   * Handle the request for saving the current canvas into a PNG image.
   *
   * @param {any} event The click event generated by the button element of the
   * interface
   */
  public onSavePNG(event: any): void{
    var svg: any = this._canvas.getDisplay();
    var width: number = this._canvas.getWidth();
    var height: number = this._canvas.getHeight();
    var svgString:string = Extras.getSVGString(svg.node());
    // passes Blob and filesize String to the callback
    Extras.svgString2Image( svgString, 2*width, 2*height, 'png', save );
    function save( dataBlob, filesize ){
      saveAs( dataBlob, "graph.png" );
    }
  }

  /**
   * Handle the request for saving the current canvas into an SVG image.
   *
   * @param {any} event The click event generated by the button element of the
   * interface
   */
  public onSaveSVG(event: any): void{
    var svg: any = this._canvas.getDisplay();
    svg.attr("title", "Dendrogram Graph");
    svg.attr("version", 1.1);
    svg.attr("xmlns", "http://www.w3.org/2000/svg");
    svg.node().parentNode.innerHTML;

    var cssStyleText:string = Extras.getCSSStyles( svg.node() );
    Extras.appendCSS( cssStyleText, svg.node() );

    var blob = new Blob([svg.node().parentNode.innerHTML], {type: "image/svg+xml"});
    saveAs(blob, "graph.svg");
  }

  /**
   * Handle the request for alphabetically sorting the leaves of a Dendrogram.
   *
   * Notice that only a best effort will be done to alphabetically sorting the
   * nodes, from top to botton. The sorting is done only by applying rotations
   * to the nodes, whithout changing the structure, and without adding crossing
   * of edges.
   *
   * @param {number} id The index of the Dendrogram selected by the user
   */
  public onSortDendro(id: number): void{
    this._dendrograms[id].sort();
    this._canvas.initDendrogramCoordinates(id);
    this._canvas.drawScene(this._interface.getDisplayMatches());
  }

  /**
   * Handle the selection to display or hide the matches of cluster across
   * pairs of consecutive Dendrograms.
   *
   * @param {boolean} showMatches An indication on whether the matches should or
   * not be displayed, according to user selection
   */
  public onToggleDisplayMatches(showMatches: boolean): void{
    this._canvas.drawScene(showMatches);
  }

}
