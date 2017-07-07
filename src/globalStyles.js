import { controlsWidth } from "./util/globals";

/* IF YOU CHANGE THINGS HERE CHANGE THEM IN static.css AS WELL! */
//export const titleFont = "aw-conqueror-sans, sans-serif";
export const titleFont = "Lato, Helvetica Neue, Helvetica, sans-serif";
export const headerFont = "Lato, Helvetica Neue, Helvetica, sans-serif";
export const dataFont = "Lato, Helvetica Neue, Helvetica, sans-serif";
export const lighterGrey = "rgb(200, 200, 200)";
export const darkGrey = "#333";
export const medGrey = "#888";
export const lightGrey = "#CCC";
export const brandColor = "#5097BA"; // #5DA8A3 (green) or #5097BA (blue)

// http://stackoverflow.com/questions/1895476/how-to-style-a-select-dropdown-with-css-only-without-javascript
export const select = {
  background: "transparent",
  fontFamily: dataFont,
  width: controlsWidth,
  fontSize: 14,
  border: "1px solid #ccc",
  height: 34,
  appearance: "none",
  borderRadius: 2,
  color: darkGrey,
  fontWeight: 400,
  marginBottom: "3px"
};

export const materialButton = {
  border: "0px",
  backgroundColor: "#FFFFFF",
  margin: 5,
  borderRadius: 2,
  cursor: "pointer",
  padding: 5,
  fontFamily: dataFont,
  color: medGrey,
  fontWeight: 400,
  textTransform: "uppercase",
  fontSize: 14,
  verticalAlign: "top"
};

export const materialButtonSelected = {
  border: "0px",
  backgroundColor: "#FFFFFF",
  margin: 5,
  borderRadius: 2,
  cursor: "pointer",
  padding: 5,
  fontFamily: dataFont,
  color: brandColor,
  fontWeight: 400,
  textTransform: "uppercase",
  fontSize: 14,
  verticalAlign: "top",
  cursor: "default"
};

export const materialButtonOutline = {
  border: "1px solid #CCC",
  backgroundColor: "#FFFFFF",
  borderRadius: 2,
  cursor: "pointer",
  paddingTop: 5,
  paddingBottom: 5,
  paddingLeft: 10,
  paddingRight: 10,
  fontFamily: dataFont,
  color: medGrey,
  fontWeight: 400,
  textTransform: "uppercase",
  fontSize: 14,
  verticalAlign: "top"
};

export const titleStyles = {
  big: {
    fontFamily: titleFont,
    fontSize: 76,
    lineHeight: "76px",
    letterSpacing: -1.8,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 300,
    color: medGrey
  },
  small: {
    fontFamily: headerFont,
    fontSize: 16,
    lineHeight: "28px",
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 500,
    color: medGrey
  }
};

export const infoPanelStyles = {
  branchInfoHeading: {
    fontSize: 15,
    fontWeight: 400,
    verticalAlign: "middle",
    padding: "5px"
  },
  buttonLink: {
    float: "right",
    fontFamily: dataFont,
    fontSize: 14,
    fontWeight: 400,
    textDecoration: "none",
    pointerEvents: "auto",
    background: "none",
    color: "white", // link color
    cursor: "pointer",
    textTransform: "uppercase",
    border: "none",
    borderRadius: 2,
    border: "1px solid #CCC",
    verticalAlign: "middle"
  },
  tooltip: {
    position: "relative",
    padding: 5,
    color: "white",
    fontFamily: dataFont,
    fontSize: 14,
    lineHeight: 1,
    fontWeight: 300
  },
  panel: {
    position: "relative",
    paddingLeft: 30,
    padding: "5% 5%",
    borderRadius: 5,
    backgroundColor: "rgba(55,55,55,0.85)",
    color: "white",
    fontFamily: dataFont,
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 300,
    maxWidth: 500
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: 400
  },
  tooltipHeading: {
    fontSize: 18,
    fontWeight: 400,
    marginBottom: "10px"
  },
  comment: {
    fontStyle: "italic",
    fontWeight: 200,
    fontSize: 14,
    marginTop: "10px"
  },
  list: {
    paddingLeft: 15,
    listStyleType: "disc"
  },
  item: {
    paddingTop: 4,
    paddingBottom: 4,
    minWidth: 120
  }
};
