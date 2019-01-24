/**
 * In a biological setting, we usually are interested on identifying tree
 * structures (clusters) that are not necesarily identical. Here we define a
 * series of different levels of similarity we want to recognise between the
 * structures being compared.<br>
 * Keep in mind that at all times, we are considering the comparison of nodes
 * within a tree-like structure (a Dendrogram).
 *
 * ISOMORPHIC
 * two trees are isomorphic if one can be obtained from the other simply by
 * performing a series of flips on its branches. The sub-graph components of
 * each tree, as well as their overall structure (links) is retained on both
 * structures
 *
 * BIOISOMORPHIC
 *
 * REARRANGED
 *
 * CONTAINED
 * we define a tree to be contained by a second tree if the
 *
 */
export enum ClusterMatchEnum{
  BIOISOMORPHIC = 1, // EQUAL
  REARRANGED = 2, // EQUIVALENT
  CONTAINED = 3, // SIMILAR
  // BIOISOMORPHIC = 4,
}
