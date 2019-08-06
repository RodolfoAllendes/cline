import * as jsPDF from 'jspdf';
import * as d3 from 'd3';

import { saveAs } from 'file-saver';

/**
 * Class that provides several utility functions to the application.
 */
export class Utils{

  /**
   * Compare two nodes, based on the given property, and indicates whether the
   * first is lesser, greater or equal to the second one.
   *
   * @param {node} a The first node in the comparison
   * @param {node} b The second node in the comparison
   * @param {string} property The particular data field that will be used to
   * compare the first and second node
   *
   * @returns {number} A number that indicates if the first node is lesser that
   * the second: -1; greater: 1; or equal: 0.
   */
  public static compareNodes(a: any, b: any, property: string): number{
    if( a.data[property] < b.data[property] )
      return -1;
    if( a.data[property] > b.data[property] )
      return 1;
    return 0;
  }

  /**
   * Count the number of times a particular character appears in a given string.
   *
   * @param {string} st The string where we will look for the character
   * @param {string} char The character we are searching for
   * @param {number} start The position in the string st from where we should
   * start counting. By default, we start from the beginning of the string

   * @returns {number} A value that indicates the number of times char appears
   * in st, starting from position start
   */
  public static count(st: string, char:string, start: number =0): number{
    var c:number = 0;
    for(var i:number =start; i<st.length; ++i)
      if( st.charAt(i) === char.charAt(0) )
        c += 1;
    return c;
  }

  /**
   * Given a color, expressed as an HSV tuple, return the same color expressed
   * as an HTML RGB color.
   *
   * @param {number} h The hue of the color
   * @param {number} s The saturation of the color, in the range [0,1]
   * @param {number} v The value of the color, in the range [0,1]
   *
   * @returns {string} An html rgb representation of the input color, i.e. a
   * string that follows the convention #RRGGBB
   */
  public static hsv2rgb(h: number, s: number, v: number): string{
    /* clamp saturation and value to 1 */
    if( s > 1 ) s = 1;
    if( v > 1 ) v = 1;
    /* storage for the color representation in RGB color space */
    var r: number = 0.0;
    var g: number = 0.0;
    var b: number = 0.0;

    var f, p, q, t;
    var k;
    if (s === 0.0) {    // achromatic case
      r = g = b = v;
    }
    else {    // chromatic case
      if (h === 360.0) h=0.0;
      h = h/60.0;
      k = Math.round(h);
      f = h - (k*1.0);

      p = v * (1.0 - s);
      q = v * (1.0 - (f*s));
      t = v * (1.0 - ((1.0 - f)*s));

      switch (k) {
        case 0:
          r = v;  g = t;  b = p;
          break;
        case 1:
          r = q;  g = v;  b =  p;
          break;
        case 2:
          r = p;  g = v;  b =  t;
          break;
        case 3:
          r = p;  g = q;  b =  v;
          break;
        case 4:
          r = t;  g = p;  b =  v;
          break;
        case 5:
          r = v;  g = p;  b =  q;
          break;
      }
    }

    r = Math.trunc(r*255);
    var rr: string = ("00" + r.toString(16)).slice(-2);
    g = Math.trunc(g*255);
    var gg: string = ("00" + g.toString(16)).slice(-2);
    b = Math.trunc(b*255);
    var bb: string = ("00" + b.toString(16)).slice(-2);
    return "#"+rr+gg+bb;
  }


  /**
   * In order to use the application, the user needs to load Dendrogram
   * structures from text files written in the Newick (or New Hampshire) format,
   * such as the ones provided by the phylogram package in R. However, in order
   * to use d3's hierarchical properties, we need to parse this text into an
   * object with a JSON-like structure.
   *
   * We define an "empty" root node for the Dendrogram, and then recursively
   * traverse the text file, searching for children and adding them to the
   * structure.
   *
   * @param {string} dendrogram The contents of the text file used as input for
   * the loadDendrogram routine
   * @param {string} id A string that represents the position of the current
   * node within the overall dendrogram structure
   *
   * @returns {object} A reference to the root of the loaded Dendrogram
   */
  public static parsePhylogramTree(dendrogram: string, id: string): any{
    // the current node is always an empty object (there is no data associated
    // to it) with an empty list of children
    var root: any = {};
    root["children"] = [];

    // given a text representing a dendrogram structure, we identify the nodes
    // that represent a child of the current node in the structure
    var children: string[] = Utils.splitIntoChildren(dendrogram);

    // and we add them to the current structure
    for (var i: number=0; i<children.length; ++i ){
      // we split the text that represent the child into its key-value parts
      var txt: string[] = Utils.rsplit(children[i],':',1);
      var c: number = Utils.count(txt[0],':',1);
      // if no extra separators are found within the key section, then the node
      // is a leaf, and we can simple add it to the structure
      if( c === 0 ){
        root["children"].push({
          // remove single quote mark from name
          "name": txt[0].substring(1,txt[0].length-1),
          "id": id+""+i,
          "distToParent": txt[1]
        });
      }
      // recursively parse the node's children, removing the first and last
      // characters, that should always be '(' and ')' respectively
      else{
        var child: string = txt[0].substring(1,txt[0].length-1);
        var o: any = Utils.parsePhylogramTree(child, id+""+i);
        o["distToParent"] = txt[1];
        o["id"] = id+""+i;
        root["children"].push(o);
      }
    }
    return root;
  }

  /**
   * Rotate a two-dimensional point, expressed as an  X,Y coordinate pair,
   * around Z-axis
   *
   * @param {number[]} p The point, in two-dimensinoal space, to be rotated
   * @param {number} rad The rotation angle, expressed in radians
   *
   * @returns {number[]} The rotated point, as a two coordinate array
   */
  public static rotate(p: number[], rad: number): number[]{
    return [ p[0]*Math.cos(rad)-p[1]*Math.sin(rad),
      p[0]*Math.sin(rad)-p[1]*Math.cos(rad) ];
  }

  /**
  * Split an input string into components, starting from the right-most
  * appearance of the separator
  *
  * @param {string} st The input string
  * @param {string} sep The string used as separator
  * @param {number} maxsplit The maximum number of components into which the
  * input string is to be splitted
  *
  * @returns {string[]} An array containing the splitted parts
  */
  public static rsplit(st: string, sep: string, maxsplit: number): string[]{
    var parts: string[];
    parts = st.split(sep);
    return maxsplit ? [ parts.slice(0, -maxsplit).join(sep) ].concat(parts.slice(-maxsplit)) : parts;
  }

  /**
   * Scale a two-dimensional point, expressed as an X, Y coordinate pair.
   *
   * @param {number[]} p The point, in two-dimensional space, to be scaled
   * @param {number[]} s A two-dimensional vector with the scale factors for X
   * and Y
   *
   * @returns {number[]} The scaled point, as a two coordinate array
   */
  public static scale(p: number[], s: number[]): number[]{
    return [ p[0]*s[0], p[1]*s[1] ];
  }

  /**
   * The Newick encodes each node whithin the hierarchy as a comma separated,
   * key-value array with the following structure:
   *
   * [ <node's name> or <list of node's children> : <distance-to-parent> , ...]
   *
   *If the key is a name, then the current node is a leaf, otherwise, the key
   * represent a list of children for the current node.
   *
   * The value component represents the distance measured from the current node
   * to its parent node.
   *
   * A sample string representing a dendrogram is as follows:
   *
   * 'ADX.x2':0.52,('ADX.x1':0.36,'ADX.x3':0.36):0.16
   *
   * Which graphically, we could interpret as:
   ```
           0.52
      |--------------- leaf ADX.x2
      |         0.36
     root      |------- leaf ADX.x1
      | 0.16  |
      |------node
              |  0.36
              |------- leaf ADX.x3
   ```
   *
   * Clearly from the example, only leaf nodes have a name.
   *
   * @param {string} rawText The text that represents the dendrogram rooted at
   * the current node.
   *
   * @returns {string[]} An array of strings, where each item represents a child
   * of the current node. In our example, the return list will have two items:
   * 'ADX.x2':0.5301862
   * ('ADX.x1':0.3647867,'ADX.x3':0.3647867):0.165399
   *
   * Notice that the second child is an internal node of the overall dendrogram
   * structure.
   */
  public static splitIntoChildren(rawTex: string): string[]{
    // initially, the list of nodes to return is empty
    var components: string[] = [];
    // the list of the current node's children is a comma separated string, thus
    // counting them gives an upper bound for the number of children the current
    // node potentially has
    var commas:number = Utils.count(rawTex, ",");
    // we will traverse the word, thus we need to keep track of the index within
    // the rawTex where we currently stand
    var previousIndex:number = 0;

    // for each comma in the rawText, we need to decide if its being used to
    // separate childrens of the current node, or other descendats further down
    // the hierarchy
    while( commas > 0 ){
      // the index within the rawText of the next comma to inspect, if none is
      // found, then simply the end of the string
      var currentIndex:number = rawTex.indexOf(',', previousIndex+1);
      if( currentIndex === -1 ){
        currentIndex = rawTex.length;
      }
      previousIndex = currentIndex;

      // between comma characters, the text will represent a child for the
      // current node only if there is an equal number of open and close
      // brackets (an uneven number means we are standing in a comma within a
      // lower level of the structure). We use this number to identify all
      // children
      var leftBrack: number = Utils.count(rawTex.substring(0,currentIndex),'(');
      var rightBrack:number = Utils.count(rawTex.substring(0,currentIndex),')');
      // if we identify a child (for leaf nodes, left and right brackets are 0)
      if( leftBrack === rightBrack ){
        // we add the corresponding text to the list of children
        components.push(rawTex.substring(0, currentIndex));
        // we remove the partial string from the remainder of the dendrogram
        rawTex = rawTex.substring(currentIndex+1);
        // we initialize the index to search for the next comma character
        previousIndex = 0;
      }
      // we have one less comma character to process
      commas -= 1;
    }
    // if there is any text left, we add it as a child
    if( rawTex !== "" )
      components.push(rawTex);

    return components;
  }

  /**
   * Translate a two-dimensional point, expressed as an X, Y coordinate pair.
   *
   * @param {number[]} p The point, in two-dimensinoal space, to be translated
   * @param {number[]} t The translation vector
   *
   * @returns {number[]} The translated point, as a two coordinate array
   */
  static translate(p:number[], t: number[]): number[]{
    return [ p[0]+t[0], p[1]+t[1] ];
  }


}
