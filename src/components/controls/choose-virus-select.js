import React from "react";
import Radium from "radium";
import {select} from "../../globalStyles";
import { RESET_CONTROLS, NEW_DATASET } from "../../actions/types";
import { loadJSONs } from "../../actions/loadData"
import { turnURLtoDataPath, restoreStateFromURL } from "../../util/urlHelpers";
import { connect } from "react-redux";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import {
  MAP_ANIMATION_PLAY_PAUSE_BUTTON
} from "../../actions/types.js";

@Radium
@connect() // to provide dispatch
class ChooseVirusSelect extends React.Component {
  constructor(props) {
    super(props);
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    selected: React.PropTypes.string.isRequired,
    choice_tree: React.PropTypes.array,
    title: React.PropTypes.string.isRequired,
    options: React.PropTypes.array.isRequired
  }
  getStyles() {
    return { base: {} };
  }

  // assembles a new path from the upstream choices and the new selection
  // downstream choices will be set to defaults in parseParams
  createPath(e) {
    let p = (this.props.choice_tree.length > 0) ? "/" : "";
    p += this.props.choice_tree.join("/") + "/" + e.target.value;
    return p;
  }

  changeDataset(newPath) {
    // 0 analytics (optional)
    analyticsControlsEvent(`change-virus-to-${newPath.replace(/\//g, "")}`);
    // 1 reset redux controls state in preparation for a change
    this.props.dispatch({type: RESET_CONTROLS});
    if (window.NEXTSTRAIN && window.NEXTSTRAIN.mapAnimationLoop) {
      clearInterval(window.NEXTSTRAIN.mapAnimationLoop);
      window.NEXTSTRAIN.mapAnimationLoop = null;
      this.props.dispatch({
        type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
        data: "Play"
      });
    }
    // 2 change URL (push, not replace)
    this.context.router.history.push({
      pathname: newPath,
      search: ""
    });
    // 3 load in new data (via the URL we just changed, kinda weird I know)
    this.props.dispatch(loadJSONs(this.context.router));
  }

  render() {
    return (
      <select
        style={select}
        value={this.props.selected}
        onChange={(e) => {
          if (e.target.value === this.props.title) { return; }
          this.changeDataset(this.createPath(e));
        }}
      >
        <option key={"titleOption"}> {this.props.title} </option>
        {
          this.props.options.map((option, i) => {
            return (
              <option key={i}>
                {option}
              </option>);
          })
        }
      </select>
    );
  }
}

export default ChooseVirusSelect;
