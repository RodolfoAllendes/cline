import * as d3 from 'd3';

import { Dendrogram } from './dendrogram';
import { Utils } from './utils';
import { ClusterMatchEnum } from './clusterMatchType';

/**
 * A ClusterMatch object is used to store a single match between nodes in a
 * source and target Dendrogram.
 *
 * We use them to improve performance, to avoid calculate them when user
 * interaction implies a new rendering of the scene, but that does not change
 * the underlying properties of the compared structures. For example, flipping a
 * Dendrogram requires the scene to be redrawn, but since the matches continue
 * to be the same, we can use a pre-calculated version of them.
 */

export class ClusterMatch{

  /** The label that provides a name for the cluster match */
  private _label: string;
  /** The source node for the match */
  private _sourceNode: any;
  /** The target node for the match */
  private _targetNode: any;
  /** a string that represents the color used for the display of the match */
  private _color: string;

  /** The list of equal branches on both the source-rooted and target-rooted
   * subtrees */
  private _equalBranches: any;

  /**
   * Initialize a new cluster match, by specifying the source node (cluster root
   * on the source Dendrogram) and the targat node that matches it on the target
   * Dendrogram.
   *
   * @constructor
   * @param {any} source A node in the source Dendrogram, that matches a second
   * node in the target Dendrogram
   * @param {any} target The node in the target Dendrogram that matches with the
   * node in the source Dendrogram
   */
  constructor(source: any, target: any){
    // initialize source and target components
    this._sourceNode = source;
    this._targetNode = target;

    // we initialize the match's label with the same name as the label used for
    // the nodes that form it
    this._label = this._sourceNode.data["label"];

    // the color for each match needs to be defined later, when the complete set
    // of matches for the entire scene has been defined
    this._color = null;

    // since the match between the source and the target nodes does not require
    // to be isomorphic (their sub-trees do not have to be equal), for each
    // branch in the source-rooted sub-tree, an equal branch may exist in the
    // target-rooted sub-tree
    // we keep a list of all equal branches, so that it can later be used for
    // highlight of the structures
    this._equalBranches = [];
  }

  /**
   * Provide access to the colour of this match
   *
   * @returns {string} A string that represents the colour
   */
  public getColor():string {
    return this._color;
  }

  /**
   * Provide access to the list of equal branches within the ClusterMatch
   *
   * @returns {any} The list of equal branches in the current match
   */
  getEqualMatches(): any{
    return this._equalBranches;
  }

  /**
   * Provide access to the label (name) of the match
   *
   * @returns {string} The label of the cluster
   */
  public getLabel(): string{
    return this._label;
  }

  /**
   * For a given cluster match, we search and identify the edges in the sub-
   * clusters rooted at source and target nodes, that are equal or different,
   * depending on the type of highlight specified as input parameter.
   *
   * @param {string} type The type of highlight we want to make, can take one of
   * the following values: "none" (no highlight), "diff" (highlight different
   * branches) or "simi" (highlight similar branches)
   */
  initEqualBranches(type: string): void{
    /* If no highlight required, return after setting up an empty list */
    this._equalBranches = [];
    if( type === "none") return;

    /* construct initial list of nodes to search for edge matching. We start
     * the search from the leaves up.*/
    var searchNodes: any = this._sourceNode.leaves();
    var targetNodes: any = this._targetNode.leaves();

    var equalEdgesSearch: string[] = [];
    var equalEdgesTarget: string[] = [];

    while( searchNodes.length > 0 ){
      /* retrieve an element from the search list*/
      var n: any = searchNodes.pop();
      /* and check for a match within the target list */
      var trg: any = targetNodes.findIndex(function(ele){
        /* if searched node is a leaf, match by name */
        if( this.value === 1)
          return this.data["name"] === ele.data["name"] &&
            this.parent.data["label"] === ele.parent.data["label"];
        /* otherwise match by label */
        return this.parent.data["label"] !== undefined &&
          ele.parent.data["label"] !== undefined &&
          ele.value !== 1 &&
          this.data["label"] === ele.data["label"] &&
          this.parent.data["label"] === ele.parent.data["label"];
      }, n);
      /* whenever we find a match, we add it to the list of matches; also, we
       * add the parent for both search and target nodes, to the respective
       * lists of elements*/
      if( trg !== -1 ){
        trg = targetNodes.splice(trg, 1)[0];
        searchNodes.push(n.parent);
        targetNodes.push(trg.parent);
        /* Add the elements to the corresponding list */
        equalEdgesSearch.push(n.parent.data["id"]+n.data["id"]);
        equalEdgesTarget.push(trg.parent.data["id"]+trg.data["id"]);
      }
    }
    if (type === "simi"){
      this._equalBranches = [equalEdgesSearch, equalEdgesTarget];
      return ;
    }

    /* when the highlight is to be done on the different branches, we actually
     * need the complement of the set of branches saved up to this point */
    searchNodes = this._sourceNode.descendants();
    targetNodes = this._targetNode.descendants();
    searchNodes.splice(0,1);
    targetNodes.splice(0,1);
    var diffEdgesSearch: string[] = [];
    var diffEdgesTarget: string[] = [];
    searchNodes.forEach(function(ele){
      diffEdgesSearch.push(ele.parent.data["id"]+ele.data["id"]);
    });
    targetNodes.forEach(function(ele){
      diffEdgesTarget.push(ele.parent.data["id"]+ele.data["id"]);
    });

    diffEdgesSearch = diffEdgesSearch.filter(edge => !equalEdgesSearch.includes(edge));
    diffEdgesTarget = diffEdgesTarget.filter(edge => !equalEdgesTarget.includes(edge));

    this._equalBranches = [diffEdgesSearch, diffEdgesTarget];
  }

  /**
   * Set the colour to be used in the display of this match.
   *
   * @param {string} color A string containing the definition of the colour
   */
  public setColor(color: string):void{
    this._color = color;
  }


}
