/*eslint-env browser*/
import React from "react";
import { infoPanelStyles } from "../../globalStyles";
import { prettyString } from "../../util/stringHelpers";
import { floatDateToMoment } from "../../util/dateHelpers";

const infoLineJSX = (item, value) => (
  <g>
    <span style={{fontWeight: "500"}}>
      {item + " "}
    </span>
    <span style={{fontWeight: "300"}}>
      {value}
    </span>
  </g>
);

const infoBlockJSX = (item, values) => (
  <div>
    <p style={{marginBottom: "-0.7em", fontWeight: "500"}}>
      {item}
    </p>
    {values.map((k, i) => (
      <p key={i} style={{fontWeight: "300", marginBottom: "-0.9em", marginLeft: "0em"}}>
        {k}
      </p>
    ))}
    <br/>
  </div>
);

const getBranchDivJSX = (d) =>
  <p>{infoLineJSX("Divergence:", prettyString(d.attr.div.toExponential(3)))}</p>;

const getBranchTimeJSX = (d, temporalConfidence) => {
  const dates = [floatDateToMoment(d.attr.num_date).format("YYYY-MM-DD")];
  if (temporalConfidence) {
    dates[1] = floatDateToMoment(d.attr.num_date_confidence[0]).format("YYYY-MM-DD");
    dates[2] = floatDateToMoment(d.attr.num_date_confidence[1]).format("YYYY-MM-DD");
    if (dates[1] === dates[2]) {
      return <p>{infoLineJSX("Date:", dates[0])}</p>;
    }
    return (
      <p>
        {infoLineJSX("Inferred Date:", dates[0])}
        <br/>
        {infoLineJSX("Date Confidence Interval:", `(${dates[1]}, ${dates[2]})`)}
      </p>
    );
  }
  return <p>{infoLineJSX("Date:", dates[0])}</p>;
};

/**
 * Display information about the colorBy, potentially in a table with confidences
 * @param  {node} d branch node currently highlighted
 * @param  {bool} colorByConfidence should these (colorBy conf) be displayed, if applicable?
 * @param  {string} colorBy must be a key of d.attr
 * @return {JSX} to be displayed
 */
const displayColorBy = (d, distanceMeasure, temporalConfidence, colorByConfidence, colorBy) => {
  if (colorBy === "num_date" || colorBy.slice(0, 2) === "gt") {
    if (colorBy !== distanceMeasure) {
      /* i.e. colorBy is date and branch lengths are divergence - should still show node date */
      return getBranchTimeJSX(d, temporalConfidence);
    }
    return null;
  }
  if (colorByConfidence === true) {
    const lkey = colorBy + "_confidence";
    if (Object.keys(d.attr).indexOf(lkey) === -1) {
      console.log("Error - couldn't find confidence vals for ", lkey);
      return null;
    }
    const vals = Object.keys(d.attr[lkey])
      .sort((a, b) => d.attr[lkey][a] > d.attr[lkey][b] ? -1 : 1)
      .slice(0, 4)
      .map((v) => `${prettyString(v)} (${(100 * d.attr[lkey][v]).toFixed(0)}%)`);
    return infoBlockJSX(`${prettyString(colorBy)} (confidence):`, vals);
  }
  return infoLineJSX(prettyString(colorBy), prettyString(d.attr[colorBy]));
};

/**
 * Currently not used - implement when augur outputs frequencies
 * @param  {node} d branch node currently highlighted
 * @return {JSX} to be displayed (or null)
 */
// const getFrequenciesJSX = (d) => {
//   if (d.frequency !== undefined) {
//     const disp = "Frequency: " + (100 * d.frequency).toFixed(1) + "%";
//     return (<p>{disp}</p>);
//   }
//   return null;
// };

/**
 * Display AA / NT mutations in JSX
 * @param  {node} d branch node currently highlighted
 * @param  {string} mutType "AA" or "nuc"
 * @return {JSX} to be displayed (or null)
 */
const getMutationsJSX = (d, mutType) => {
  /* mutations are stored at:
  NUCLEOTIDE: d.muts = list of strings
  AMINO ACID: d.aa_muts = dict of proteins -> list of strings
  */
  if (mutType === "nuc") {
    if (typeof d.muts !== "undefined" && d.muts.length) {
      const nDisplay = 9; // max number of mutations to display
      const n = d.muts.length; // number of mutations that exist
      let m = d.muts.slice(0, Math.min(nDisplay, n)).join(", ");
      m += n > nDisplay ? " + " + (n - nDisplay) + " more" : "";
      return infoLineJSX("Nucleotide mutations:", m);
    }
    return infoLineJSX("No nucleotide mutations", "");
  } else if (typeof d.aa_muts !== "undefined") {
    /* calculate counts */
    const prots = Object.keys(d.aa_muts);
    const counts = {};
    for (const prot of prots) {
      counts[prot] = d.aa_muts[prot].length;
    }
    /* are there any AA mutations? */
    if (prots.map((k) => counts[k]).reduce((a, b) => a + b, 0)) {
      const nDisplay = 3; // number of mutations to display per protein
      const m = [];
      prots.forEach((prot) => {
        if (counts[prot]) {
          let x = prot + ":\u00A0\u00A0" +
            d.aa_muts[prot].slice(0, Math.min(nDisplay, counts[prot])).join(", ");
          if (counts[prot] > nDisplay) {
            x += " + " + (counts[prot] - nDisplay) + " more";
          }
          m.push(x);
        }
      });
      return infoBlockJSX("AA mutations:", m);
    }
    return infoLineJSX("No amino acid mutations", "");
  }
  console.log("Error parsing mutations for branch", d.strain);
  return null;
};

const getBranchDescendents = (n) => {
  if (n.fullTipCount === 1) {
    return <g>{infoLineJSX("Branch leading to", n.strain)}<p/></g>;
  }
  return <g>{infoLineJSX("Number of descendents:", n.fullTipCount)}<p/></g>;
};

/**
 * This maps tree coordinates to coordinates on the svg.
 * @param  {float} x x
 * @param  {float} y y
 * @param  {reactSVGpanZoom} V viewer state
 * @return {[x,y]} point on plane
 */
const treePosToViewer = (x, y, V) => {
  const dx = (x * V.a + V.e); // this is the distance form the upper left corner
  const dy = (y * V.d + V.f); // at the current zoom level
  return {x: dx, y: dy};
};

const getPanelStyling = (d, viewer) => {
  const viewerState = viewer.getValue();
  const xOffset = 10;
  const yOffset = 10;
  const width = 200;
  const pos = treePosToViewer(d.xTip, d.yTip, viewerState);
  const styles = {
    container: {
      position: "absolute",
      width,
      padding: "10px",
      borderRadius: 10,
      zIndex: 1000,
      pointerEvents: "none",
      fontFamily: infoPanelStyles.panel.fontFamily,
      fontSize: 14,
      lineHeight: 1,
      fontWeight: infoPanelStyles.panel.fontWeight,
      color: infoPanelStyles.panel.color,
      backgroundColor: infoPanelStyles.panel.backgroundColor,
      wordWrap: "break-word",
      wordBreak: "break-word"
    }
  };
  if (pos.x < viewerState.viewerWidth * 0.6) {
    styles.container.left = pos.x + xOffset;
  }else{
    styles.container.right = viewerState.viewerWidth - pos.x + xOffset;
  }
  if (pos.y < viewerState.viewerHeight * 0.55) {
    styles.container.top = pos.y + 4 * yOffset;
  } else {
    styles.container.bottom = viewerState.viewerHeight - pos.y + yOffset;
  }
  return styles;
};

/* the actual component - a pure function, so we can return early if needed */
const InfoPanel = ({tree, mutType, temporalConfidence, distanceMeasure,
  hovered, viewer, colorBy, colorByConfidence}) => {
  if (!(tree && hovered)) {
    return null;
  }
  const tip = hovered.type === ".tip";
  const d = hovered.d;
  const styles = getPanelStyling(d, viewer);
  let inner;
  if (tip) {
    inner = (
      <p>
        {infoLineJSX(prettyString(colorBy) + ":", prettyString(d.n.attr[colorBy]))}
        {distanceMeasure === "div" ? getBranchDivJSX(d.n) : getBranchTimeJSX(d.n, temporalConfidence)}
      </p>
    );
  } else {
    inner = (
      <g>
        {getBranchDescendents(d.n)}
        {/*getFrequenciesJSX(d.n, mutType)*/}
        {getMutationsJSX(d.n, mutType)}
        {distanceMeasure === "div" ? getBranchDivJSX(d.n) : getBranchTimeJSX(d.n, temporalConfidence)}
        {displayColorBy(d.n, distanceMeasure, temporalConfidence, colorByConfidence, colorBy)}
      </g>
    );
  }
  return (
    <div style={styles.container}>
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div style={infoPanelStyles.tooltipHeading}>
          {tip ? d.n.attr.strain : null}
        </div>
        {inner}
        <p/>
        <div style={infoPanelStyles.comment}>
          {tip ? "Click on tip to display more info" : "Click to zoom into clade"}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
