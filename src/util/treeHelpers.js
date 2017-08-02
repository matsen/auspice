import { tipRadius, freqScale, tipRadiusOnLegendMatch } from "./globals";
import { getGenotype } from "./getGenotype";
import { scalePow } from "d3-scale";

export const gatherTips = (node, tips) => {

  if (typeof node.children !== "undefined") {
    for (let i = 0, c = node.children.length; i < c; i++) {
      gatherTips(node.children[i], tips);
    }
  } else {
    tips.push(node);
  }
  return tips;
};

export const getVaccines = (tips) => {
  const v = [];
  tips.forEach((tip) => {
    if (vaccineStrains.indexOf(tip.strain) !== -1) {
      tip.choice = vaccineChoice[tip.strain];
      v.push(tip);
    }
  });
  return v;
};

export const calcDates = (nodes) => {
  nodes.forEach((d) => {
    d.dateval = new Date(d.date);
  });
};

export const minimumAttribute = (node, attr, min) => {
  if (typeof node.children !== "undefined") {
    for (let i = 0, c = node.children.length; i < c; i++) {
      min = minimumAttribute(node.children[i], attr, min);
    }
  } else if (node[attr] < min) {
    min = node[attr];
  }
  return min;
};

export const maximumAttribute = (node, attr, max) => {
  if (typeof node.children !== "undefined") {
    for (let i = 0, c = node.children.length; i < c; i++) {
      max = maximumAttribute(node.children[i], attr, max);
    }
  } else if (node[attr] > max) {
    max = node[attr];
  }
  return max;
};

export const calcBranchLength = (node) => {
  if (typeof node.children !== "undefined") {
    for (let i = 0, c = node.children.length; i < c; i++) {
      calcBranchLength(node.children[i]);
      node.children[i].branch_length = node.children[i].xvalue - node.xvalue;
    }
  }
};

/**
 * for each node, calculate the number of subtending tips (alive or dead)
**/
export const calcFullTipCounts = (node) => {
  node.fullTipCount = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcFullTipCounts(node.children[i]);
      node.fullTipCount += node.children[i].fullTipCount;
    }
  } else {
    node.fullTipCount = 1;
  }
};


/**
 * for each node, calculate the number of tips in view.
**/
export const calcTipCounts = (node, visibility) => {
  node.tipCount = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcTipCounts(node.children[i], visibility);
      node.tipCount += node.children[i].tipCount;
    }
  } else {
    node.tipCount = visibility[node.arrayIdx] === "visible" ? 1 : 0;
  }
};

/**
sets each node in the tree to alive=true if it has at least one descendent with current=true
**/
export const setNodeAlive = (node) => {
  if (typeof node.children !== "undefined") {
    let aliveChildren = false;
    for (let i = 0, c = node.children.length; i < c; i++) {
      setNodeAlive(node.children[i]);
      aliveChildren = aliveChildren || node.children[i].alive;
    }
    node.alive = aliveChildren;
  } else {
    node.alive = node.current;
  }
};


export const adjust_freq_by_date = (nodes, rootNode) => {
  // console.log("all nodes and root node", nodes, rootNode)
  return nodes.map((d) => {
    // console.log("tipcount & rootnodeTipcount", d.tipCount, rootNode.tipCount)
    // d.frequency = (d.tipCount) / rootNode.tipCount;
  });
};

// export const arrayInEquality = function(a,b) {
//   if (a&&b){
//     const eq = a.map((d,i)=>d!==b[i]);
//     return eq.some((d)=>d);
//   }else{
//     return true;
//   }
// };

// branch thickness is from clade frequencies
export const calcBranchThickness = function (nodes, visibility, rootIdx) {
  let maxTipCount = nodes[rootIdx].tipCount;
  /* edge case: no tips selected */
  if (!maxTipCount) {
    maxTipCount = 1;
  }
  return nodes.map((d, idx) => (
    visibility[idx] === "visible" ? freqScale((d.tipCount + 5) / (maxTipCount + 5)) : 1
  ));
};

export const getTipColorAttribute = function (node, colorScale, sequences) {
  if (colorScale.colorBy.slice(0, 3) === "gt-" && colorScale.genotype) {
    return getGenotype(colorScale.genotype[0][0],
                       colorScale.genotype[0][1],
                       node,
                       sequences.sequences);
  }
  return node.attr[colorScale.colorBy];
};

export const calcNodeColor = function (tree, colorScale, sequences) {
  if (tree && tree.nodes && colorScale && colorScale.colorBy) {
    const nodeColorAttr = tree.nodes.map((n) => getTipColorAttribute(n, colorScale, sequences));
    // console.log(nodeColorAttr.map((n) => colorScale.scale(n)))
    return nodeColorAttr.map((n) => colorScale.scale(n));
  }
  return null;
};

const determineLegendMatch = function (selectedLegendItem,
                                       node,
                                       legendBoundsMap,
                                       colorScale,
                                       sequences) {
  let bool;
  const nodeAttr = getTipColorAttribute(node, colorScale, sequences);
  // equates a tip and a legend element
  // exact match is required for categorical qunantities such as genotypes, regions
  // continuous variables need to fall into the interal (lower_bound[leg], leg]
  if (legendBoundsMap) {
    bool = (nodeAttr <= legendBoundsMap.upper_bound[selectedLegendItem]) &&
           (nodeAttr > legendBoundsMap.lower_bound[selectedLegendItem]);
  } else {
    bool = nodeAttr === selectedLegendItem;
  }
  return bool;
};

export const calcTipRadii = function (selectedLegendItem,
                           colorScale,
                           sequences,
                           tree
                         ) {
  if (selectedLegendItem && tree && tree.nodes){
    const legendMap = colorScale.continuous ? colorScale.legendBoundsMap : false;
    return tree.nodes.map((d) => determineLegendMatch(selectedLegendItem, d, legendMap, colorScale, sequences) ? tipRadiusOnLegendMatch : tipRadius);
  } else if (tree && tree.nodes) {
    return tree.nodes.map((d) => tipRadius);
  }
  return null; // fallthrough
};

const parseFilterQuery = function (query) {
  const tmp = query.split("-").map((d) => d.split("."));
  return {
    "fields": tmp.map((d) => d[0]),
    "filters": tmp.map((d) => d[d.length - 1].split(","))
  };
};

/* recursively mark the parents of a given node active
by setting the node idx to true in the param visArray */
const makeParentVisible = function (visArray, node) {
  if (node.arrayIdx === 0 || visArray[node.parent.arrayIdx]) {
    return; // this is the root of the tree or the parent was already visibile
  }
  visArray[node.parent.arrayIdx] = true;
  makeParentVisible(visArray, node.parent);
};

/**
 * Create a visibility array to show the path through the tree to the selected tip
 * @param  {array} nodes redux tree nodes
 * @param  {int} tipIdx idx of the selected tip
 * @return {array} visibility array (values of "visible" | "hidden")
 */
export const identifyPathToTip = (nodes, tipIdx) => {
  const visibility = new Array(nodes.length).fill(false);
  visibility[tipIdx] = true;
  makeParentVisible(visibility, nodes[tipIdx]); /* recursive */
  return visibility.map((cv) => cv ? "visible" : "hidden");
};

/* calcVisibility
USES:
inView: attribute of phyloTree.nodes, but accessible through redux.tree.nodes[idx].shell.inView
  Bool. Set by phyloTree, determines if the tip is within the view.
controls.filters
use dates NOT controls.dateMin & controls.dateMax

RETURNS:
visibility: array of "visible" or "hidden"

ROUGH DESCRIPTION OF HOW FILTERING IS APPLIED:
 - time filtering is simple - all nodes (internal + terminal) not within (tmin, tmax) are excluded.
 - inView filtering is similar - nodes out of the view cannot possibly be visible
 - filters are a bit more tricky - the visibile tips are calculated, and the parent
    branches back to the MRCA are considered visibile. This is then intersected with
    the time & inView visibile stuff

FILTERS:
 - filters stored in redux - controls.filters
 - filters have 2 keys, each with an array of values
   keys: "region" and/or "authors"
 - filterPairs is a list of lists. Each list defines the filtering to do.
   i.e. [ [ region, [...values]], [authors, [...values]]]
*/
export const calcVisibility = function (tree, controls, dates) {
  if (tree.nodes) {
    /* reset visibility */
    let visibility = tree.nodes.map((d) => {
      return true;
    });

    // if we have an analysis slider active, then we must filter on that as well
    // note that min date for analyis doesnt apply
    if (controls.analysisSlider && controls.analysisSlider.valid) {
      /* extra slider is numerical rounded to 2dp */
      const valid = tree.nodes.map((d) =>
        d.attr[controls.analysisSlider.key] ? Math.round(d.attr[controls.analysisSlider.key] * 100) / 100 <= controls.analysisSlider.value : true
      );
      visibility = visibility.map((cv, idx) => (cv && valid[idx]));
    }

    // IN VIEW FILTERING (internal + terminal nodes)
    /* edge case: this fn may be called before the shell structure of the nodes
    has been created (i.e. phyloTree's not run yet). In this case, it's
    safe to assume that everything's in view */
    let inView;
    try {
      inView = tree.nodes.map((d) => d.shell.inView);
    } catch(e) {
      inView = tree.nodes.map(() => true);
    }
    /* intersect visibility and inView */
    visibility = visibility.map((cv, idx) => (cv && inView[idx]));

    // FILTERS
    const filterPairs = [];
    Object.keys(controls.filters).map((key) => {
      if (controls.filters[key].length) {
        filterPairs.push([key, controls.filters[key]]);
      }
    });
    if (filterPairs.length) {
      /* find the terminal nodes that were (a) already visibile and (b) match the filters */
      const filtered = tree.nodes.map((d, idx) => (
        !d.hasChildren && visibility[idx] && filterPairs.every((x) => x[1].indexOf(d.attr[x[0]]) > -1)
      ));
      const idxsOfFilteredTips = filtered.reduce((a, e, i) => {
        if (e) {a.push(i);}
        return a;
      }, []);
      /* for each visibile tip, make the parent nodes visible (recursively) */
      for (let i = 0; i < idxsOfFilteredTips.length; i++) {
        makeParentVisible(filtered, tree.nodes[idxsOfFilteredTips[i]]);
      }
      /* intersect visibility and filtered */
      visibility = visibility.map((cv, idx) => (cv && filtered[idx]));
    }

    // TIME FILTERING (internal + terminal nodes)
    const userDateMin = controls.dateScale(controls.dateFormat.parse(dates.dateMin)); // convert caldate to numdate
    const userDateMax = controls.dateScale(controls.dateFormat.parse(dates.dateMax)); // convert caldate to numdate
    const timeFiltered = tree.nodes.map((d, idx) => {
      return !(d.attr.num_date < userDateMin || d.parent.attr.num_date > userDateMax);
    });
    visibility = visibility.map((cv, idx) => (cv && timeFiltered[idx]));

    /* return array of "visible" or "hidden" values */
    return visibility.map((cv) => cv ? "visible" : "hidden");
  }
  return "visible";
};

export const branchInterpolateColour = "#BBB";
export const branchOpacityConstant = 0.4;
export const branchOpacityFunction = scalePow()
  .exponent([0.3])
  .domain([0, 1])
  .range([branchOpacityConstant, 1])
  .clamp(true);
// entropy calculation precomputed in augur
// export const calcEntropyOfValues = (vals) =>
//   vals.map((v) => v * Math.log(v + 1E-10)).reduce((a, b) => a + b, 0) * -1 / Math.log(vals.length);
