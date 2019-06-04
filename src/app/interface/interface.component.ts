import { Component, EventEmitter, Output, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ClusterMatchEnum } from '../clusterMatchType';

/**
 * Component Description
 */
@Component({
  selector: 'app-interface',
  templateUrl: './interface.component.html',
  styleUrls: ['./interface.component.css'],
})

/**
 * Describe the functionality associated with the handling of the User Interface.
 *
 * In general, we will capture the events triggered by the user through the use
 * of the available interface, and propagate these through to the appropriate
 * handlers in the main application file.
 */
export class InterfaceComponent implements OnInit, AfterViewInit {

  /** Event triggered when the user chooses to change the Highlighting of
   *  branches */
  @Output() changeHighlightTypeEmitter = new EventEmitter<string>();
  /** Event triggered when the user chooses to change the matching algorithm for
   *  clusters */
  @Output() changeMatchTypeEmitter = new EventEmitter<number>();
  /** Event triggered when the user chooses a different sample size for its data */
  @Output() changeSampleSizeEmitter = new EventEmitter<number>();
  /** Event triggered when the user chooses to horizontally flip a specific
   *  Dendrogram structure */
  @Output() flipDendrogramEmitter = new EventEmitter<number>();
  /** Event triggered when the user chooses to load a new Dendrogram structure */
  @Output() loadDendrogramEmitter = new EventEmitter<any>();
  /** Event triggered when the user chooses to remove a Dendrogram from the visualization */
  @Output() removeDendrogramEmitter = new EventEmitter<number>();
  /** Event triggered when the user chooses to save the current visualization to
   *  a PDF file */
  @Output() savePDFEmitter = new EventEmitter<any>();
  /** Event triggered when the user chooses to save the current visualization to
   *  a PNG file */
  @Output() savePNGEmitter = new EventEmitter<any>();
  /** Event triggered when the user chooses to save the current visualization to
   *  an SVG file */
  @Output() saveSVGEmitter = new EventEmitter<any>();
  /** Event triggered when the user chooses to alphabetically sort the leaves of
   *  a particular Dendrogram structure */
  @Output() sortDendrogramEmitter = new EventEmitter<number>();
  /** Event triggered when the user chooses to turn on or off the display of
   *  lines between matches across different Dendrogram structures */
  @Output() toggleDisplayMatchesEmitter = new EventEmitter<boolean>();

  /** Reference to the Select item in the Template, available for the user to
   *  choose an element to remove from the visualization */
  @ViewChild('removeDendrogramSelect', {static: false}) removeDendrogramSelect: ElementRef;

  /** Reference to the Select item in the Template, available for the user to
   *  choose the type of highlighting to be used on matched Dendrogram clusters.
   *  Takes one of the following values:
   *  none - (no highlight),
   *  diff - (highlight the differences in the branches) or
   *  simi - (highlight the similarities in the branches) */
  @ViewChild('highlightTypeSelect', {static: false}) highlightTypeSelect: ElementRef;

  /** Reference to the Select item in the Template, available for the user to
   *  horizontally flip a specific Dendrogram structure */
  @ViewChild('flipDendrogramSelect', {static: false}) flipDendrogramSelect: ElementRef;

  /** the names of the dendrogram structures currently on display */
  private dendrogramNames: string[];
  /** flag that indicates whether cluster matches should be displayed or not */
  private displayMatches: boolean;

  /** Integer values used to key the different types of match between similar
   *  clusters */
  private matchKeys: string[];
  /** Name used for each different type of match between similar clusters */
  private matchLabels: any;
  /** Currently selected type of match strategy for similar clusters */
  private matchType: number;

  /** The minimum number of leaves used by the cluster matching routine */
  private sampleSize: number;

  /**
   * Initialize all private variables
   * @constructor
   */
  constructor() {
    // there are no loaded dendrogram structures when the application starts
    this.dendrogramNames = [];
    // cluster matches are shown by default
    this.displayMatches = true;
    // Initially, to be considered non-trivial in terms of cluster matching, a
    // node needs to have at least 3 leaves
    this.sampleSize = 3;
  }

  /**
   * Initialize the attributes of the Interface Component associated with the
   * on screen display
   */
  ngOnInit() {
    // the types of matching that can be done between dendrograms is recovered
    // from an enum type
    this.matchLabels = ClusterMatchEnum;
    this.matchKeys = Object.keys(ClusterMatchEnum).filter(Number);
    this.matchType = ClusterMatchEnum.BIOISOMORPHIC;
  }

  /**
   * Initialization of views to Template elements
   */
  ngAfterViewInit(){
    // by default, branches in matched clusters are not highlighted
    this.highlightTypeSelect.nativeElement.selectedIndex = 0;
  }

  /**
   * Request the main application to change the type of highlighting used on the
   * branches of matching clusters.
   */
  public changeHighlightType(): void{
    this.changeHighlightTypeEmitter.emit(this.highlightTypeSelect.nativeElement.value);
  }

  /**
   * Request the main application to change the type of matching routine used
   * for similar clusters across different Dendrogram structures.
   *
   * @param {object} event The DOM event that triggered the call
   */
  public changeMatchType(event: any): void{
    this.changeMatchTypeEmitter.emit(Number(event.target.value));
  }

  /**
   * Request the application to change the minumum number of leaves a
   * sub-cluster needs to have in order to be considered for matching across
   * Dendrogram structures.
   *
   * @param {object} event The DOM event generated on user interaction
   */
  public changeSampleSize(event: any): void{
    this.changeSampleSizeEmitter.emit(Number(event.target.value));
  }

  /**
   * Request the application to horizontally flip the Dendrogram structure
   * selected by the user.
   */
  public flipDendrogram(): void{
    // capture the index of the option selected
    var index: number = this.flipDendrogramSelect.nativeElement.selectedIndex-1;
    // trigger the flip of the corresponding element in the parent application
    if( index>= 0 )
      this.flipDendrogramEmitter.emit(index);
    // reset the selection
    this.flipDendrogramSelect.nativeElement.selectedIndex = 0;
  }

  /**
   * Provide access to the component's list of Dendrogram names, from outside
   * classes.
   *
   * @returns {string[]} The list of names currently used for each of the
   * clusters in the visualization.
   */
  public getDendrogramsNames(): string[]{
    return this.dendrogramNames;
  }

  /**
   * Provide access to the flat that indicates whether cluster matches should be
   * displayed by the application or not.
   *
   * @returns {boolean} True if the matches are to be displayed by the
   * application and false if not
   */
  public getDisplayMatches(): boolean{
    return this.displayMatches;
  }

  /**
   * Provide access to the currently selected style of match highlighting, from
   * three available options:
   * None - Highlight is not applied
   * Diff - Different branches of a cluster match are highlighted
   * Simi - Equal branches of a cluster match are highlighted
   *
   * @returns {string} A string representing the type of highlight that should
   * be done for dendrogram branches that belong to a cluster match, or none in
   * case no highlight has been selected
   */
  public getHighlightType(): string{
    return this.highlightTypeSelect.nativeElement.value;
  }

  /**
   * Provide access to the selected matching routine to be used in the process
   * of finding matching clusters across different Dendrogram structures.
   *
   * @returns {number} An integer value that represents the type of matching
   * strategy. The values returned are taken from the ClusterMatchEnum type.
   */
  public getMatchType(): number{
    return this.matchType;
  }

  /**
   * Provide access to the value of sample size.
   *
   * @returns {number} The value currently selected as the mimimum number of
   * leaves that a node needs to have in order to be considered non-trivial for
   * the cluster matching routine
   */
  public getSampleSize(): number{
    return this.sampleSize;
  }

  /**
   * Request the main application to load a file containing a new Dendrogram
   * structure for display. Additionally, it adds the name of the file as
   * identifyer to the list of currently loaded structures.
   *
   * @param {object} event The DOM component that triggered the call to the
   * function
   */
  public loadDendrogram(event: any): void{
    var file: any = event.target.files[0];
    // trig an event in the main application to load the dendrogram
    this.loadDendrogramEmitter.emit(file);
    // add an option to Remove and Flip selection lists
    this.dendrogramNames.push(file.name);
  }

  /**
   * Request the main Application the removal of the user selected Dendrogram
   * structure. It also removes the name of such structure from the local list
   * of loaded Dendrograms.
   */
  public removeDendrogram(): void{
    // capture the index of the option selected
    var index: number = this.removeDendrogramSelect.nativeElement.selectedIndex-1;
    // trigger the removal of the element from the parent application
    this.removeDendrogramEmitter.emit(index);
    // remove the option from Remove and Flip select items
    this.dendrogramNames.splice(index,1);
  }

  /**
   * Request the application to save the current display as a PDF file.
   *
   * param {object} event The event generated by the user's interaction
   */
  public savePDF(event: any): void{
    this.savePDFEmitter.emit(event);
  }

  /**
   * Request the application to save the current display as a PNG file.
   *
   * param {object} event The event generated by the user's interaction
   */
  public savePNG(event: any): void{
    this.savePNGEmitter.emit(event);
  }

  /**
   * Request the application to save the current display as a PDF file.
   *
   * param {object} event The event generated by the user's interaction
   */
  public saveSVG(event: any): void{
    this.saveSVGEmitter.emit(event);
  }

  /**
   * Request the application to apply an alphabetical sorting of the leaves to
   * the user selected Dendrogram structure.
   *
   * @param {object} event The event generated by the user's interaction
   */
  public sortDendrogram(event: any): void{
    // capture the index of the option selected
    var index: number = event.target.selectedIndex-1;
    // trigger the flip of the corresponding element in the parent application
    this.sortDendrogramEmitter.emit(index);
    // clear the option from the component and allow the user to select a
    // different structure to sort
    event.target.selectedIndex = 0;
  }

  /**
   * Request the application to turn on/off the display of lines representing
   * the match of similar structures across diferent Dendrogram structures.
   *
   * @param {object} event The event generated by the user's interaction
   */
  public toggleDisplayMatches(event: any): void{
    this.toggleDisplayMatchesEmitter.emit(this.displayMatches);
  }
}
