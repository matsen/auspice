/*eslint-env browser*/
/*eslint max-len: 0*/
import { parseGenotype } from "../util/getGenotype";
import getColorScale from "../util/getColorScale";
import { calcNodeColor } from "../util/treeHelpers";
import * as types from "./types";

export const updateColors = function (providedColorBy = undefined) {
  return function (dispatch, getState) {
    const { controls, tree, sequences, metadata } = getState();
    /* step 0: bail if all required params aren't (yet) available! */
    if (!(tree.loadStatus === 2 && sequences.loadStatus === 2 && metadata.loadStatus === 2)) {
      // console.log(
      //   "updateColorScale not running due to loadStatuses of ",
      //   "tree", tree.loadStatus,
      //   "sequences", sequences.loadStatus,
      //   "metadata", metadata.loadStatus
      // );
      return null;
    }
    const colorBy = providedColorBy ? providedColorBy : controls.colorBy;

    /* step 1: calculate the required colour scale */
    const version = controls.colorScale.version + 1;
    // console.log("updateColorScale setting colorScale to ", version);
    const colorScale = getColorScale(colorBy, tree, sequences, metadata.colorOptions, version);
    /*   */
    if (colorBy.slice(0, 3) === "gt-" && sequences.geneLength) {
      colorScale.genotype = parseGenotype(colorBy, sequences.geneLength);
    }

    /* step 2: calculate the node colours */
    const nodeColors = calcNodeColor(tree, colorScale, sequences);

    /* step 3: dispatch */
    dispatch({
      type: types.NEW_COLORS,
      colorBy,
      colorScale,
      nodeColors,
      version
    });
    return null;
  };
};

/* changeColorBy is just a wrapper for updateColors */
export const changeColorBy = function (colorBy) {
  return function (dispatch) {
    dispatch(updateColors(colorBy));
  };
};
