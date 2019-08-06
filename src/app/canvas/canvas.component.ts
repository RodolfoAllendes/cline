import * as d3 from 'd3';

import { Component, EventEmitter, OnInit, Output, Input, ChangeDetectionStrategy } from '@angular/core';
import { Dendrogram } from '../dendrogram';
import { Utils } from '../utils';
import { ClusterMatch } from '../clusterMatch';

/**
 * Component Description
 */
@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],

  changeDetection: ChangeDetectionStrategy.Default
})

/**
 * Component used to handle the drawing of the canvas element, on which all
 * Dendrograms and their matches will be displayed.
 *
 * Usually, the display responds to the different user interactions captured by
 * the InterfaceComponent, relayed over by the main Application.
 */
export class CanvasComponent implements OnInit {

  /** Amount of pixels used to display the Title of each Dendrogram */
  private readonly TITLE_HEIGHT: number = 50;
  /** Amount of pixels used to display the distance axis between root and leaves
   *  of a single Dendrogram */
  private readonly AXIS_HEIGHT: number = 50;

  /** Blank space at the LEFT of the left-end of each Dendrogram graph */
  private readonly LEFT_PADDING: number = 50;
  /** Blank space left at the RIGHT of the right-end of each Dendrogram graph */
  private readonly RIGHT_PADDING: number = 150;

  /** Width, in pixels, of a dendrogram plot, including only nodes and edges.
   *  Room for labels is accounted for separately */
  private readonly GRAPH_WIDTH: number = 350;

  /** TODO - maybe make this size depending on the number of leaves of the
   * largest structure in the visualization */
  private readonly DENDRO_HEIGHT: number = 200;
  /** Mimimum number of pixels that are left between two consecutive leafs in a
   *  dendrogram. Together with the number of leaves of the largest dendrogram
   *  currently in the visualization, will be used to determine the size of the
   *  canvas */
  private readonly LEAF_PADDING: number = 30;

  /** Width, in pixels, reserved for the display of leaves' labels */
  private readonly LABEL_WIDTH: number = 100;

  /* Update the display when the cutoff of a Dendrogram is changed */
  @Output() changeCutoffEmitter = new EventEmitter<number>();


  /** Reference to the list of currently loaded Dendrogram structures kept by
   *  the main Application */
  @Input() _dendrograms: Dendrogram[];

  /* current matches between dendrograms */
  private _matches: any[] = [];

  /** Reference to the display element (canvas) of the DOM */
  private _display: any;
  /** The width of a SINGLE Dendrogram Graph, including graph, padding and label
   *  required space */
  private _dendroWidth: number;
  /** The height of the LARGEST Dendrogram currently in the graph */
  private _dendroHeight: number;
  /** The current width, in pixels, of the canvas element used for display */
  private _canvasWidth: number;
  /** The current height, in pixels, of the canvas element used for display */
  private _canvasHeight: number;
  /** The type of highlight used on sub-cluster branches */
  private _highlight:string;

  /**
   * Constructor
   */
  constructor() { }

  /**
   * Init basic properties of the canvas used for the visualization
   */
  ngOnInit() {
    /* initialize the canvas as a D3 visualization element */
    this._display = d3.select('svg#display');

    /* initialize the width of a single Dendrogram graph */
    this._dendroWidth = this.LEFT_PADDING + this.RIGHT_PADDING + this.GRAPH_WIDTH + this.LABEL_WIDTH;

    /* based on the size of individual structures, initialize the size of the
     * canvas area */
    this._canvasWidth = this._dendroWidth;
    this._canvasHeight = this.DENDRO_HEIGHT+this.TITLE_HEIGHT+this.AXIS_HEIGHT;

    /* Initially, no highlight of branches is done */
    this._highlight = "none";
  }

  /**
   * Remove all SVG elements from the display component
   */
  private _clearScene(): void{
    var prev: any = this._display.selectAll('*');
    prev.remove();
  }

  /**
   * Draw the distance axis, showing the separation between root and leaves,
   * together with a visual indication of the cutoff value used for the
   * definition of inner labels, and thus for the calculation of cluster matches
   * between consecutive structures.
   *
   * The cutoff widget should allow the user to dynamically define a new value,
   * that is then forwarded to the corresponding Dendrogram in order to change
   * the cluster matching and thus, the visualization as a whole.
   *
   * @param {number} id The index of the Dendrogram being drawn
   * @param {any} svg The root svg element where visual elements for axis will
   * be added
   */
  private _drawAxis(id: number, svg: any):void{
    /* reference for use inside annonymous function */
    var self: any = this
    /* the current value for the cutoff */
    var cutoff: number = this._dendrograms[id].getCutoff();
    /* the distance between the root and the leaves of the Dendrogram */
    var dist: number = this._dendrograms[id].getRoot().data["distance"];
    /* pixel value of the left-side boundary for the axis */
    var xmin: number = id * this._dendroWidth;
    xmin += this._dendrograms[id].getFlipped() ? this._dendroWidth - this.RIGHT_PADDING : this.LEFT_PADDING;
    /* pixel value of the right-side boundary for the axis */
    var xmax: number = xmin;
    xmax += this._dendrograms[id].getFlipped() ? -this.GRAPH_WIDTH : this.GRAPH_WIDTH;
    /* pixel value for the current position of the cutoff widget */
    var x: number = xmax - (xmax-xmin)*cutoff/dist;
    /* pixel value for the vertical positioning of the axis */
    var y: number = this.TITLE_HEIGHT;

    /* Visual representation of the axis, as a horizontal line, with two end
     * widgents, that extends from the root on the left, to the position of the
     * leaves in the right */
    svg.append("path")
      .attr("class", "dendro-axis")
      .attr("d", "M "+ xmin + ", " + y
          + " L "+ xmax +", "+ y
          + " M "+ xmin +", "+ (y-5)
          + " L "+ xmin +", "+ (y+5)
          + " M "+ xmax +", "+ (y-5)
          + " L "+ xmax +", "+ (y+5)
      )
    ;
    /* Drawing of the left-most value for the distance axis */
    svg.append("text")
      .attr("class", "dendro-axis")
      .attr("x", xmin)
      .attr("y", y-7)
      .text(dist.toFixed(2))
    ;
    /* Drawing of the right-most value of the distance axis */
    svg.append("text")
      .attr("class", "dendro-axis")
      .attr("x", xmax)
      .attr("y", y-7)
      .text("0")
    ;
    /* Add the visual components for the cutoff. These include a draggable
     * widget that moves along the distance axis, the current value for the
     * cutoff, and a vertical line that spans the whole Dendrogram
     * TO-DO make the line draggable*/
    /* Interactive widget (circle) used to modify the cutoff value */
    svg.append("circle")
      .data([{ x: x, y: y }])
      .attr("class", "dendro-cutoff")
      .attr("cx", function(d){ return d.x; } )
      .attr("cy", function(d){ return d.y; } )
      .attr("r", 4)
      .call(d3.drag()
        .on("drag", dragged)
        .on("end", dragend)
      )
    ;
    /* Current value for the cutoff */
    svg.append("text")
      .data([{ x: x, y: y }])
      .attr("class", "dendro-cutoff")
      .attr("x", function(d){ return d.x; })
      .attr("y", function(d){ return d.y+25; })
      .text((this._dendrograms[id].getCutoff()).toFixed(2))
    ;
    /* Vertical line to span the Dendrogram to show the current cutoff value */
    svg.append("path")
      .data([{ x: x, y: y }])
      .attr("class", "dendro-cutoff")
      .attr("d", function(d){
          return "M "+d.x+", " +(d.y+30)+" L "+d.x+", "+self._canvasHeight;
        }
      )
    ;
    /* Internal function used to update the position of the visual components
     * associated to the cutoff value, whenever the user drags the corresponding
     * widget */
    function dragged(d){
      var dpix: number = Math.abs(xmax-xmin);
      if( !self._dendrograms[id].getFlipped() ){
        x = d3.event.x > xmax ? xmax : d3.event.x < xmin ? xmin : d3.event.x;
        cutoff = dist - (dist*(x-xmin)/dpix);
      }
      else{
        x = d3.event.x < xmax ? xmax : d3.event.x > xmin ? xmin : d3.event.x;
        cutoff = dist*(x-xmax)/dpix;
      }
      d3.select(this)
        .attr("cx", d.x = x)
      ;
      d3.select(this.parentNode).selectAll("text.dendro-cutoff")
        .attr("x", d.x = x)
        .text(cutoff.toFixed(2))
      ;
      d3.select(this.parentNode).selectAll("path.dendro-cutoff")
        .attr("d", "M "+x+", "+(d.y+30)+" L "+x+", "+self._canvasHeight)
      ;
    }
    /* Only when the user finishes to drag the widget, a call is made for the
     * scene to be updated, using the new cutoff for internal node label
     * definition
     * TODO - Updating labels means cluster-matches could have changed too, so
     * need to have a look at that too. */
    function dragend(d){
      self._dendrograms[id].setCutoff(Number.parseFloat(cutoff.toFixed(2)));
      self.changeCutoffEmitter.emit(id);
    }
  }

  /**
   * Draw a single Dendrogram structure. To do so, it divides the process into
   * different routines, to draw the title, axis, edges and nodes, in that
   * order.
   *
   * @param {number} id The index of the Dendrogram to be drawn
   */
  private _drawDendrogram(id: number): void{
    /* Each Dendrogram is drawn in its own group within the SVG tree. Every
     * graphic element associated with this Dendrogram will be nested inside
     * this original group */
    var graph: any = this._display.append("g")
      .attr("class", "dendrogram")
      .attr("id", "dendro"+id)
    ;

    /* 1. Dendrogram's Title */
    this._drawTitle(id, graph);

    /* 2. Dendrogram's distance Axis */
    var axis: any = graph.append("g")
      .attr("class", "dendrogram-axis")
    ;
    this._drawAxis(id, axis);

    /* 3. Dendrogram's Edges */
    var edges: any = graph.append("g")
      .attr("class", "dendrogram-edges")
    ;
    this._drawEdges(id, edges);

    /* 4. Dendrogram' Nodes */
    var nodes: any = graph.append("g")
      .attr("class", "dendrogram-nodes")
    ;
    this._drawNodes(id, nodes);
  }

  /**
   * Draw all the edges (paths between nodes) within a specific Dedrogram
   * structure
   *
   * @param {number} id The index of the Dendrogram being drawn
   * @param {any} svg The root dom element where edges will be added
   */
  private _drawEdges(id: number, svg:any): void{
    /* From the Dendrogram, load the data used for each edge */
    var edges = svg.selectAll("path")
      .data(this._dendrograms[id].getRoot().links())
    ;
    /* Based on the data, create an element for every edge in the structure */
    edges.enter().append("path")
      .attr("class", "edge")
      .attr("stroke", "gray")
      .attr("id", function(d){
        return d.source.data["id"]+d.target.data["id"];
      })
      .attr("d", function(d){
        return "M "+d.source.x+", "+d.source.y
        + " L "+d.source.x+", "+d.target.y
        + " M "+d.source.x+", "+d.target.y
        + " L "+d.target.x+", "+d.target.y;
      })
    ;
  }

  /**
   * Highlight the similarities or differences (according to user selection)
   * across matching sub-clusters in different Dendrogram structures.
   *
   * TO-DO: Need to define a way to extend this process to multiple Dendrogram
   * structures, as currently it only works for the highlighting of
   * matches across consecutive Dendrograms, and not paying any attention to
   * possible overlaps when more than 2 structures are on display.
   *
   * @param {number} i The index of the first dendrogram in the comparisson
   * @param {number} j The index of the second dendrogram in the comparisson
   */
  private _drawHighlightedPath(i:number, j:number): void{
    /* for each set of cluster matches across consecutive pairs of Dendrogram
     * structures */
    for( var k=0; k<this._matches[i].length; ++k ){
      var match = this._matches[i][k];
      /* request the IDs of all edges that are part of each match */
      var targets: string[] = match.getEqualMatches();
      /* colour branches on the i-th Dendrogram */
      var dom: any = this._display.selectAll("#dendro"+i);
      for (var x=0; x<targets[0].length; ++x){
        dom.selectAll("#"+targets[0][x])
          .attr("stroke", match.getColor())
        ;
      }
      /* colour branches on the j-th Dendrogram */
      dom = this._display.selectAll("#dendro"+j);
      for (var x=0; x<targets[1].length; ++x){
        dom.selectAll("#"+targets[1][x])
          .attr("stroke", match.getColor())
        ;
      }
    }
  }

  /**
   * Matches between consecutive pairs of Dendrograms are represented by coloured
   * lines that join the matched nodes on both structures.
   *
   * @param {number} i The index of the first Dendrogram
   * @param {number} j The index of the second Dendrogram
   */
  private _drawMatches(i:number, j:number): void{
    // add a new group to the svg, to represent the set of lines connecting
    // dendrograms
    var g3 = this._display.append("g")
      .attr("id", "lines"+i+"-"+j);
    /* add line elements for each cluster match */
    var lines = g3.selectAll("line")
       .data(this._matches[i]);
    // define the drawing properties of each line
    lines.enter().append("line")
      .attr("stroke-width", function(d){ return d["size"]; })
      .attr("stroke", function(d){ return d.getColor(); })
      .attr("x1", function(d){ return d._sourceNode.x;})
      .attr("x2", function(d){ return d._targetNode.x;})
      .attr("y1", function(d){ return d._sourceNode.y;})
      .attr("y2", function(d){ return d._targetNode.y;})
      ;
  }

  /**
   * Draw the nodes of the Dendrogram, both internal and leaves.
   *
   * Internal nodes are only represented by an circle, while leaves are also
   * drawn with their respective labels.
   *
   * Additionally, all nodes show their matching label on hovering, and allow the
   * user to vertically flip their components when clicked.
   *
   * @param {number} id The index of the Dendrogram being drawn
   * @param {any} svg The root dom element where nodes will be added
   */
  private _drawNodes(id: number, svg: any): void{
    /* Reference to be used inside annonymous functions */
    var self: any = this;
    /* From the Dendrogram, load the information on nodes */
    var nodes = svg.selectAll(".node")
      .data(this._dendrograms[id].getRoot().descendants())
    ;
    /* For each node in the Dendrogram, we create an element in the svg
     * component */
    var node = nodes.enter().append("g")
      .attr("class", function(d){
        var flip = self._dendrograms[id].getFlipped() ? " flip" : "";
        return d.value == 1 ? "node leaf"+flip : "node internal"+flip;
      })
    ;
    /* Add a circle to represent each node */
    node.append("circle")
      .attr("id", function(d){ return d.data.name; } )
      .attr("cx", function(d){ return d.x })
      .attr("cy", function(d){ return d.y })
      .attr("r", 4)
      .on("click", function(target){
        self._dendrograms[id].flipYNode(target);
        self.drawScene();
      })
      .append("svg:title")
        .text(function(d){
          return d.data.label == undefined ? "None" : d.data.label;
        });

    /* nodes also have asociated a text, drawn from their name property, note
     * that internal nodes have a blank name, and thus this will only show the
     * corresponding label of leaf nodes */
    node.append("text")
      .attr("x", function(d){ return d.x })
      .attr("y", function(d){ return d.y })
      .attr("dx", function(d){ return self._dendrograms[id].getFlipped() ? -8 : 8; })
      .text(function(d){ return d.data.name; })
      .attr("class", function(d){
        var flip = self._dendrograms[id].getFlipped() ? "flip " : "";
        return d.value == 1 ? flip+"leaf node" : flip+"internal node";
      });
  }

  /**
   * Draw the title of a Dendrogram structure
   *
   * @param {number} id The id of the Dendrogram being drawn
   * @param {any} svg The root svg element where the title will be added
   */
  private _drawTitle(id: number, svg: any): void{
    svg.append("text")
      .attr("class", "dendro-title")
      .attr("x", id*this._dendroWidth + this._dendroWidth/2 )
      .attr("y", 20)
      .text(this._dendrograms[id].getTitle())
      ;
  }

  /**
   * Adds all the required elements for the visualization of Fendrograms to the
   * SVG canvas of the application.
   *
   * Since the SVG canvas is a 2D plane, elements are drawn on top of eachother
   * in a secuencial manner. Thus, the components for the final visualization
   * are added in the following order:
   * 1. Draw the matches between clusters - if requested
   * 2. Draw the dendrogram structures
   * 3. Highlight cluster matches whithin the dendrogram structure
   *
   * @param {boolean} drawMatches Indicates if matches between pairs of
   * consecutive Dendrograms should be shown (default) or not.
   */
  public drawScene(drawMatches: boolean = true):void {
    /* Before a new frame can be drawn, we need to clear the canvas */
    this._clearScene();

    /* 1. Draw matches between pairs of consecutive Dendrograms */
    if( drawMatches && this._dendrograms.length >= 2){
      for(var i=0; i<this._dendrograms.length-1; ++i )
        this._drawMatches(i, i+1);
    }

    /* 2. Draw Dendrogram structures */
    for(var i: number = 0; i<this._dendrograms.length; ++i )
      this._drawDendrogram(i);

    /* 3. Highlight edges according to the matches between Dendrograms sub-clusters */
    if( drawMatches && this._highlight !== "none" && this._dendrograms.length >= 2){
      for(var i=0; i<this._dendrograms.length-1; ++i){
        this._drawHighlightedPath(i, i+1);
      }
    }
  }

  /**
   * Provide access to the reference to the display canvas
   *
   * @returns {Object} The SVG display element
   */
  public getDisplay(): any{
    return this._display;
  }

  /**
   * Get the height, in pixels, of the drawing area
   *
   * @returns {int} The height of the canvas
   */
  public getHeight(): number{
    return this._canvasHeight;
  }

  /**
   * Get the width, in pixels, of the drawing area
   * @returns {int} The width of the canvas
   */
  public getWidth(): number{
    return this._canvasWidth;
  }

  /**
   * The original positioning of a dendrogram is always top to bottom, with the
   * upper left coordinate of its bounding box matching the upper left corner of
   * the canvas.
   * In order to position it correctly, we need to rotate each structure by pi/2
   * counter-clockwise, and then translate it to its final position.
   * We apply these transformations by simply modifying the coordinates or the
   * points used to position every node within the dendrogram structures.
   *
   * @param {number} index The index of the Dendrogram whose coordinates need to
   * be updated. If a default value of -1 is used, then all Dendrograms are
   * updated
   */
  public initDendrogramCoordinates(index: number = -1): void{
    // each dendrogram needs to be displaced on X according to the number of
    // pixels needed to fit each dendrogram structure
    var dx: number = this.GRAPH_WIDTH + this.LABEL_WIDTH + this.LEFT_PADDING + this.RIGHT_PADDING;
    // in Y, we need to consider the height of the dendrogram (to nullify
    // counter clockwise rotation) plus the space required for title and axis
    // var dy: number = this.DENDRO_HEIGHT + this.TITLE_HEIGHT + this.AXIS_HEIGHT;
    var dy: number = this._dendroHeight + this.TITLE_HEIGHT + this.AXIS_HEIGHT;
    if( index !== -1 ){
      this._dendrograms[index].updateCoordinates(dx*index+this.LEFT_PADDING, dy, this.GRAPH_WIDTH,
        // this.DENDRO_HEIGHT, this.LABEL_WIDTH);
        this._dendroHeight, this.LABEL_WIDTH);
      return ;
    }


    for(var i:number = 0; i<this._dendrograms.length; ++i)
      this._dendrograms[i].updateCoordinates(dx*i+this.LEFT_PADDING, dy, this.GRAPH_WIDTH,
        // this.DENDRO_HEIGHT, this.LABEL_WIDTH);
        this._dendroHeight, this.LABEL_WIDTH);
  }

  /**
   * Calculate the list of matches between consecutive pairs of Dendrogram
   * structures.
   *
   * The resulting list of matches is stored as a 2D array of clusterMatch
   * elements, where the i-th row contains the list of matches between the i-th
   * and (i+1)-th Dendrogram structures.
   *
   * Each individual match is identified by a source (on the i-th Dendrogram)
   * and a target (on the i+1-th Dendrogram) nodes. Also, each match is given a
   * colour, to be used when displayed.
   *
   * @param {number} minLeaves A nmumber that represents the minimum amount of
   * leaves a node needs to have, in order to be considered non-trivial, and
   * being included in the sub-cluster matching routine
   */
  public updateClusterMatches(minLeaves: number): void{
    /* reset the list of matches */
    this._matches = [];

    /* No matches can be calculated when there is less than 2 structures */
    if( this._dendrograms.length < 2 ) return;

    /* 1. Calculate the matches
     * This needs to be done for each pair of consecutive structures in the
     * Dendrograms list */
    for(var i=0; i<this._dendrograms.length-1; ++i ){
      var set = this._dendrograms[i].findMatchingClusters(
        this._dendrograms[i].getRoot(),
        this._dendrograms[i+1], minLeaves)
      ;
      /* add the matches to the current list */
      this._matches.push(set);
    }

    /* 2. Give each match a colour
     * For colour definition we use D3's scale-chromatic extension. Since each
     * match is based on the node's label, we can use that to assign the same
     * colour to a match that occurs across more than one pair of Dendrogram.
     * Disticnt matches will be assigned distinct colours whenever possible, but
     * colours will be re-used if the number of clusters surpass the number of
     * available colours for a particular scheme.*/
    var idx = 0;
    var colors = {};
    var scheme = d3.schemeSet1;

    console.log('updateClusterMatches', this._matches);

    // go through the matches between every dendrogram pair
    for(var i=0; i<this._matches.length; ++i){
      // and then through each cluster match within a specific dendrogram pair
      for(var j=0; j<this._matches[i].length; ++j){
        /* check if a coulour has already been defined for clusters with the
         * same label, and if not, assign them a value */
        if( colors[this._matches[i][j].getLabel()] === undefined ){
          colors[this._matches[i][j].getLabel()] = scheme[idx%scheme.length];
          ++idx;
        }
        console.log("Match",i,j,colors[this._matches[i][j].getLabel()]);
        this._matches[i][j].setColor(colors[this._matches[i][j].getLabel()]);
        /* Re-define the highlight of branches within the match */
        this._matches[i][j].initEqualBranches(this._highlight);
      }
    }
  }

  /**
   * Update the type of hightlight that should be used on cluster matches.
   *
   * @param {string} hlghtType the type of highlight that should be applied to
   * branches of matched clusters. Can take one of the following values: None
   * (does not apply any highlight), Diff (to hightlight different branches) or
   * Simi (to apply hightlight to identical branches).
   */
  public updateMatchHighlight(hlghtType: string): void{
    this._highlight = hlghtType;
    /* Matches are stored in a 2-dimensional list, where each row stores all
     * the matches for a particular pair of Dendrograms, and each column stores
     * and individual match */
    for(var i=0; i<this._matches.length; ++i){
      for(var j=0; j<this._matches[i].length; ++j){
        this._matches[i][j].initEqualBranches(hlghtType);
      }
    }
  }

  /**
   * We use a pre-defined amount of pixels to draw each Dendrogram on screen.
   * Since the positioning of the Dendrograms is side by side, we only need to
   * update the width of the drawing canvas.
   *
   * @returns {number[]} An arraw of two values, containing the width and height
   * of the drawing canvas.
   */
  public updateSize(): number[]{
    /** Check for the largest dendrogram in the visualization, to use its size
     *  as parameter for the whole visualization */
    this._dendroHeight = 0;
    for(var i=0; i<this._dendrograms.length; ++i ){
      let size: number = this._dendrograms[i].getLeafCount() * this.LEAF_PADDING;
      if ( size > this._dendroHeight )
        this._dendroHeight = size;
    }

    this._canvasWidth = this._dendrograms.length * this._dendroWidth;
    this._canvasHeight = this._dendroHeight + this.TITLE_HEIGHT + this.AXIS_HEIGHT;

    window.dispatchEvent(new Event('resize'));
    return [this._canvasWidth, this._canvasHeight];
  }

}
