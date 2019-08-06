import * as d3 from 'd3';

import { Utils } from './utils';
import { ClusterMatch } from './clusterMatch'
import { ClusterMatchEnum } from './clusterMatchType'

/**
 * A dendrogram (from Greek dendro-tree and gramma-drawing) is a tree diagram
 * frequently used to illustrate the arrangement of the clusters produced by
 * hierarchical clustering. Dendrograms are often used in computational biology
 * to illustrate the clustering of genes or samples, sometimes on top of heatmaps.
 * Source: wikipedia
 */
export class Dendrogram{

  /** The name used to identify the dendrogram within the visualization */
  private _title: string;
  /** Pointer to the root node withtin the dendrogram's hierarchy */
  private _root: any;
  /** The number of leaves in the dendrogram */
  private _leafCount: number;
  /** Cuttof distance, from the leaves, up to which matching nodes are found in
   *  in a Dendrogram. Can also be understand as the distance, from the leaves
   *  up to which labels for internal nodes will be calculated. */
  private _cutoff: number;
  /** Flag that indicates whether the dendrogram should be visualized using a
  * default arrangement (root on the left and leaves on the right), or fliped on
  * its Y-axis (root on the right and leaves on the left) */
  private _flipped: boolean;

  /**
   * Initialize a new Dendrogram structure, by providing only a name for it.
   * The pointer to the root node is by default initialized to null, the default
   * cutoff distance is set to 1.5, and the flip variable is by default set to
   * false.
   *
   * @constructor
   * @param {string} [title=Undefined] The name given to the new dendrogram
   */
  constructor(title: string = "Undefined"){
    // the title or name for the dendrogram
    this._title = title;
    // a pointer to the root or the tree
    this._root = null;
    // the number of leafs in the dendrogram
    this._leafCount = -1;
    // set the default cutoff to 1.5
    this._cutoff = 1.5;
    // flag - whether the dendrogram should be presented with the root on the
    // left side (flip === false), or on the right side (flip === true)
    this._flipped = false;
  }

  /**
   * Given a node (representing a whole sub-tree in the structure) of the
   * Dendrogram, search for a matching node within the other Dendrogram structure.
   * When no matching node is found, recursively search for matches among the
   * children of the current node.
   *
   * minChildren indicates the minimum number of children that the current node
   * has to have in order to search for matches. This is used to avoid searching
   * for trivial (leaves) matches.
   *
   * @param {any} node A node in the Dendrogram we are trying to match within
   * the other Dendrogram
   * @param {Dendrogram} other The Dendrogram where we will try to find matching
   * nodes
   * @param {number} minChildren The minimum amount of descendats the given node
   * has to have, before being considered a trivial cluster
   * @return {any} A list of ClusterMatch objects, representing the matching of
   * the given node (or its descendants) to nodes within the other Dendrogram.
   * If no match is found for the given node or any of its descendats, a null
   * value is returned
   */
  public findMatchingClusters(node: any, other: Dendrogram, minChildren: number = 3): any{
    // we start by checking the current node is not a leaf, nor is below the
    // level where it is considered a trivial cluster
    if( node.value < minChildren )
      return [];

    // check if there is a match for node within the other Dendrogram
    var match: any = this._matchCluster(node, other, minChildren);
    // and if not null, return it
    if( match !== null )
      return [match];

    // if nothing is found, then we move down the structure on this dendrogram,
    // and recursively search for matches for all of the current node's children
    var matches: any = [];
    for(var i=0; i<node.children.length; ++i){
      matches = matches.concat(this.findMatchingClusters(node.children[i], other, minChildren));
    }
    // filter out the cases where a match for a particular child was not found
    // (i.e. we obtained a null return within the loop)
    matches = matches.filter( function (n){
      return n !== null ;
    });

    // return the list of all found matches.
    return matches;
  }

  /**
   * All nodes in a Dendrogram are initially drawn with the root at the left end
   * of the diagram, and the leaves at the right end.
   *
   * When set as flipped, the coordinates of each node within the Dendrogram are
   * mirrored, as to display it with its root at the right end, and the leaves
   * at the left end.
   *
   * @param {number} labelWidth The width, measured in screen pixels, reserved
   * for the display of leaves' labels
   */
  private _flipXCoordinates(labelWidth: number): void{
    // these are the screen coordinates, over the x-axis of the root and leaves
    var xroot: number = this._root.x;
    var xleaf: number = this._root.leaves()[0].x;

    // traverse the dendrogram modifying the coordinates of each node
    this._root.each(function(node){
      // to flip the nodes, we simply position them at a distance from the root
      // (in pixels) to the right, equal to the distance they had from a leaf
      // to the left. We need to save some space for the node's label.
      node.x = labelWidth + xroot + (xleaf - node.x);
      return node;
    });
  }

  /**
   * Given a node in the Dendrogram, do a vertical flip of all of its children.
   *
   * @param {any} node The node in the Dendrogram whose children are to be
   * flipped
   */
  public flipYNode(node: any): void{
    // leaf nodes can't be fliped, so we return
    if (node.value === 1)
      return;
    // as with the horizonal flip, vertically fliping the sub-tree changes only
    // Y coordinates of nodes. To do this, and retain the spaced used for the
    // display, we need information on the Y coordinate of the top- and bottom-
    // most nodes in the sub-tree. This nodes will necesarily be leaves
    var leaf: any[] = node.leaves();
    var minY: number = Number.POSITIVE_INFINITY;
    var maxY: number = Number.NEGATIVE_INFINITY;
    // find the maximum and minimum Y coordinates among the leaves of node
    leaf.forEach(function(d){
      maxY = d.y > maxY ? d.y : maxY;
      minY = d.y < minY ? d.y : minY;
    });
    // change the coordinates of each descendant of node
    node.descendants().forEach(function(d){
      d.y = maxY - (d.y - minY);
      return d;
    });
  }

  /**
   * Provide access to the cutoff distance.
   *
   * @returns {number} The cuttoff distance set for this Dendrogram.
   */
  public getCutoff(): number{
    return this._cutoff;
  }

  /**
   * Provide access to the flipped state of the Dendrogram.
   *
   * @returns {boolean} Whether the Dendrogram should be displayed using a
   * default or flipped layout
   */
  public getFlipped(): boolean{
    return this._flipped;
  }

  /**
   * Provide access to the number of leaves the dendrogram has.
   *
   * @returns {number} The number of leaves of the dendrogram
   */
  public getLeafCount(): number{
    return this._leafCount;
  }

  /**
   * Provide access to the root of the Dendrogram.
   *
   * @returns {any} The pointer to the root node of the Dendrogram
   */
  public getRoot(): any{
    return this._root;
  }

  /**
   * Provide access to the name of the Dendrogram.
   *
   * @returns {string} The title of the Dendrogram
   */
  public getTitle(): string{
    return this._title;
  }

  /**
   * Initialize the value of leafCount.
   */
  public initLeafCount():void{
    this._leafCount = this._root.leaves().length;
  }

  /**
   * For a given node in the Dendrogram, find a matching node within the other
   * Dendrogram.
   *
   * @param {any} node A node in the Dendrogram, for which we are looking
   * matches in the other dendrogram
   * @param {Dendrogram} other The second Dendrogram structure
   * @param {number} minChildren The minimum number of leaves a node needs to
   * have not to be considered trivial
   * @returns {ClusterMatch} A list of exactly one ClusterMatch object that
   * contains the given node and the matching node found in the other Dendrogram.
   * If not match was found, a null value is returned.
   */
  private _matchCluster(node: any, other: Dendrogram, minChildren: number): any{
    // search for the current object (node) in the other dendrogram
    var found: boolean = false;
    var match: any = null;
    other.getRoot().eachBefore(function(trgt){
      if( found )
        return trgt;
      /* a match exits if the labels of the objective and target node are equal
       * and the number of children of the target node is at least the minimum
       * required not to be considered trivial */
      if( node.data["label"] !== undefined &&
          trgt.value >= minChildren &&
          node.data["label"] === trgt.data["label"]){
        // do not continue to look in lower levels if I found a match at the
        // current one
        found = true;

        // we identify the nodes in the source and target dendrograms, to later
        // this information to construct the visualization
        match = new ClusterMatch(node, trgt);
      }
    });
    // return either the found match or null (match didn't get modified)
    return match;
  }

  /**
   * Nodes are not equally distributed along the X axis, as returned by the
   * hierarchization arrangement of D3, but they are at specific distances from
   * eachother, as result of the original clutering analysis.
   * This function shifts the nodes positions, along the X axis, in order to
   * properly display such information.
   */
  private _scaleXCoordinates(): void{
    var world: number = this._root.data.distance;
    var pixels: number = this._root.leaves()[0].x - this._root.x;
    var rootx: number = this._root.x;

    this._root.each(function(node){
      node.x = ((world - node.data.distance)/world) *  pixels;
      node.x += rootx;
      return node;
    });
  }

  /**
   * Modify the cutoff distance of this Dendrogram.
   *
   * @param {number} cutoff The new cutoff distance
   */
  public setCutoff(cutoff: number):void{
    this._cutoff = +cutoff;
  }

  /**
   * Initinally, nodes only contain incremental information regarding the
   * distance at which they stand from their parent. This is stored in field
   * distToParent, within the node's data.
   * Using this method, we add information to each node on the absolute distance
   * from itself to its leaves.
   */
  public setDistance(): void{
    // to set the distance, we traverse the tree, using a post-order approach,
    // i.e., we only set the distance for the current node after it has been set
    // for all its children
    this._root.eachAfter(function(d){
      // by definition, the distance for a leaf node is 0, d.value indicates the
      // size of the subtree rooted at node d, thus a node with value 1
      // corresponds to a leaf
      if( d.value === 1 ){
        d.data["distance"] = 0;
        return d;
      }
      // since all leaves are positioned at a 0 distance, the distance from the
      // current node to its leaves can be calculated as the sum of the distance
      // between the node and its first child, and the distance between the first
      // child to a leaf
      var nodeToChild: number = parseFloat(d.children[0].data["distToParent"]);
      var childToLeaf: number = d.children[0].data["distance"];
      d.data["distance"] = nodeToChild + childToLeaf ;
      return d;
    });

    /* Update the cutoff to be half the distance between the root and the leaves
     * of the Dendrogram */
    this._cutoff = this._root.data["distance"] / 2;
  }

  /**
   * Our matching algorithm works under the assumption that only leaves in the
   * original Dendrogram representation have a label. Under this assumption, we
   * define the labels for the internal nodes of the Dendrogram, in a way that
   * allows us to reduce the problem of finding matching nodes across different
   * structure, to compare their respective labels.
   *
   * The labels for each internal node are defined in a way that, depending on
   * user selection, retain information on the children of the node, their
   * organization, and whether they are repeated or not.
   *
   * @param {boolean} keepStructure Indicates whether the label should include
   * information regarding the structure of the node's descendants or not
   * @param {boolean} keepDuplicates Indicates whether duplicated names among
   * the current node's children should be included or not on the label. If true,
   * then the name of the repeated child will appear on the label as many times
   * as the children. When set to false, repeated names will appear on the label
   * only once
   * @param {string} separator Depending on the selection of the previous flags,
   * the separator will be used as part of the concatenation process used in the
   * definition of the current node's label
   */
  public setLabels(keepStructure: boolean = true, keepDuplicates: boolean = true,
    separator: string="-"): void{

    // Copy so that we can access this object from within the anonymous function
    var self: any = this;

    // we traverse the tree using post-order, thus defining the current node's
    // label only after all of its children's labels have already been set
    this._root.eachAfter(function(d){

      // leaf nodes already have a label
      if( d.value === 1 )
        return d;
      // nodes located at a distance larger than the cutoff, are not required
      // to have a label
      if( d.data["distance"] > self._cutoff ){
        d.data["label"] = undefined;
        return d;
      }

      // the label of the current node is based on the name of it's children,
      // thus, the first step is to recover all children's names
      var childNames: string[] = [];
      for( var i: number=0; i<d.children.length; ++i ){
        var name:string = d.children[i].data["label"];
        if( !keepDuplicates ){ // split composite names to later remove
          var s = name.split(separator);
          childNames = childNames.concat(s);
        }
        else
          childNames.push(name);
      }

      // since the branch positioning isn't important in our analysis, we first
      // sort the names... this is equivalent to rotate the branches
      childNames = childNames.sort();

      // remove duplicated names from the list if so requested
      if( !keepDuplicates ){
        childNames = childNames.filter(function(item, pos){
          return childNames.indexOf(item) == pos;
        });
      }

      // we concatenate the children's names into a single string, using the
      // defined separator
      var label:string = childNames[0];
      for( var i=1; i<childNames.length; ++i ){
        label += separator;
        label += childNames[i];
      }

      // to keep keepStruct we wrap the name of the node between brackets
      if( keepStructure )
        label = "_"+label+"_";//label = "("+label+")";

      // finally, we assign the composited label to the current node
      d.data["label"] = label;
      return d;
    }); // eachAfter
  }

  /**
   * Our algorithm for finding matching nodes (and this clusters) across
   * different Dendrograms is based on the assumption that initially only leaves
   * are given a name. Then, we use this name to assign a label to each node on
   * the Dendrogram, so the required first step for this process, is to assign a
   * label to each leave.
   *
   * In some biological contexts, the name of the leaves is made out of
   * different components, where the last one, for example, could reference a
   * sample number. Since this information is not necesarily biologically
   * signficant, we add a way to remove the last component of the leave's name
   * before setting it as label.
   *
   * @param {boolean} trim Indicates whether the last component of the leaf's
   * name should be included or not in the label
   * @param {string} separator the separator used for trimming the name of the leafs.
   * Default value "."
   */
  public setLeafLabels(trim: boolean = true, separator: string = "."): void{
    // traverse the dendrogram structure
    this._root.each(function(node){
      if( node.value === 1 ) // the node is a leaf
        if( trim )
          node.data["label"] = Utils.rsplit(node.data["name"],separator,1)[0];
        else
          node.data["label"] = node.data["name"];
      return node;
    });
  }

  /**
   * Set the root node for the Dendrogram
   *
   * @param {any} root A pointer to the root node of the Dendrogram
   */
  public setRoot(root: any): void{
    this._root = root;
  }

  /**
   * Change the name of the Dendrogram.
   *
   * @param {string} title The new name given to the Dendrogram
   */
  public setTitle(title: string): void{
    this._title = title;
  }

  /**
   * Automatically sort the nodes of a Dendrogram, based on their label, from
   * top to bottom. Notice that the sorting of nodes retains the structure of
   * the Dendrogram, i.e. the nodes are not moved from one branch of the tree to
   * a different one as part of the sorting procedure.
   */
  public sort(): void{
    this._root.sort(function(a,b){
      if (a.data.label !== undefined && b.data.label !== undefined ){
        var result:number = a.data.label.toLowerCase().localeCompare(b.data.label.toLowerCase());
        return result;
      }
      return -1;
    });

  }

  /**
   * Toggle the current value of flipped, i.e. change it to false when the
   * current value is true, and vice-versa.
   */
  public toggleFlipped(): void{
    this._flipped = !this._flipped;
  }

  /**
   * After loading, the nodes in a Dendrogram are give an initial screen
   * position by the cluster method available on D3 for hierarchical structures.
   * However, this provides a layout of the nodes arranged from top-down of the
   * elements.
   *
   * Based on a series of parameters, this function applies geometrical
   * transformations on the coordinates that represent the node's positions are
   * made to arrange them appropriately.
   *
   * We also need to consider the fact that, in the case of displaying more than
   * one Dendrogram structure, from the second structure onwards, we need to add
   * in our calcuation infomration regarding how much each structure is to be
   * displaced, in order to fit the drawing area.
   *
   * @param {number} dx The amount of pixels in X we need to displace nodes
   * @param {number} dy The amount of pixels in Y we need to displace nodes
   * @param {number} width The width of a dendrogram structure
   * @param {number} height The height of a dendrogram structure
   * @param {number} labelWidth The amount of pixels used for label display
   */
  public updateCoordinates(dx: number, dy: number, width: number, height: number,
    labelWidth: number): void{

    // to assign an initial position for all nodes within the dendrogram, we
    // use d3's cluster function
    var cluster: any;
    cluster = d3.cluster()
      .size([height, width]); // cluster function arranges the dendrogram
    cluster(this._root);       // horizontally, so we switch width and height

    // once we have the initial coordinates, we update them in order to
    // visualize the dendrogram vertically and
    // using as much space available
    this._root.each(function(node){
      var p: number[] = [ node.x, node.y ];
      // to place the dendrogram vertically, we rotate it 90 in -Z
      p = Utils.rotate(p, -Math.PI/2);
      // then, we displace it, allong X and Y, to its final position
      p = Utils.translate(p, [dx, dy]);
      // finally, we update the corresponding values of the node
      node.x = p[0];
      node.y = p[1];
      return node;
    });

    // scale the coordinates of nodes to represent the correct distance between
    // nodes, as calculated by the underlying clustering algorithm
    this._scaleXCoordinates();

    // flip vertically if so specified by the user
    if( this._flipped )
      this._flipXCoordinates(labelWidth);
  }

} // class Dendrogram
