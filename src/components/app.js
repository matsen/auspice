/*eslint-env browser*/
import React from "react";
import { connect } from "react-redux";
import { BROWSER_DIMENSIONS, loadJSONs } from "../actions";
import { NEW_DATASET } from "../actions/controls";
import { modifyURL, restoreStateFromURL, turnURLtoDataPath } from "../util/urlHelpers"
import "whatwg-fetch"; // setup polyfill
import Radium from "radium";
import _ from "lodash";
import Header from "./framework/header";
import Background from "./framework/background";
import ToggleSidebarTab from "./framework/toggle-sidebar-tab";
import Controls from "./controls/controls";
import Frequencies from "./charts/frequencies";
import Entropy from "./charts/entropy";
import Map from "./map/map";
import TreeView from "./tree/treeView";
import queryString from "query-string";
import * as globals from "../util/globals";
import Sidebar from "react-sidebar";

const returnStateNeeded = (reduxState) => {
  return {
    tree: reduxState.tree,
    sequences: reduxState.sequences,
    metadata: reduxState.metadata,
    colorOptions: reduxState.metadata.colorOptions,
    colorBy: reduxState.controls.colorBy,
    datasetPathName: reduxState.controls.datasetPathName
  };
};
/* BRIEF (INCOMPLETE) REMINDER OF PROPS AVAILABLE TO APP:
  colorOptions: parameters for each colorBy value (country, region etc)
      ideally come from the JSON, but there are defaults if necessary

  React-Router v4 injects length, action, location, push etc into props,
    but perhaps it's more consistent if we access these through
    this.context.router
    see https://reacttraining.com/react-router/#history
*/
@connect(returnStateNeeded)
@Radium
class App extends React.Component {
  constructor(props) {
    super(props);
    /* window listener to see when width changes cross thrhershold to toggle sidebar */
    /* A note on sidebar terminology:
    sidebarOpen (AFAIK) is only used via touch drag events
    sidebarDocked is the prop used on desktop.
    While these states could be moved to redux, they would need
    to be connected to here, triggering an app render anyways
    */
    const mql = window.matchMedia(`(min-width: ${globals.controlsHiddenWidth}px)`);
    mql.addListener(() => this.setState({sidebarDocked: this.state.mql.matches}));
    this.state = {
      location: {
        pathname: this.props.location.pathname,
        query: queryString.parse(this.props.location.search)
      },
      mql,
      sidebarDocked: mql.matches,
      sidebarOpen: false
    };
  }
  static propTypes = {
    /* react */
    dispatch: React.PropTypes.func.isRequired,
    params: React.PropTypes.object,
    /* component api */
    error: React.PropTypes.object,
    loading: React.PropTypes.bool,
    user: React.PropTypes.object,
    routes: React.PropTypes.array
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"

  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  componentWillMount() {
    /* i'll probably remove all of this in a future commit */
    const tmpQuery = queryString.parse(this.context.router.location.search);
    const pathname = this.props.location.pathname;
    const suffix = (pathname.length && pathname[pathname.length - 1] !== "/") ? "/" : "";
    this.setState({
      location: {
        pathname: pathname + suffix,
        query: tmpQuery
      }
    });
  }

  componentDidMount() {
    /* This is hit on the initial load and when a browser is refreshed
    but NOT when browser back/forward buttons are used.
    */

    /* firstly, set up browser stuff for resizes etc */
    this.handleResizeByDispatching(); // initial dimensions
    window.addEventListener( // future resizes
      "resize",
      _.throttle(this.handleResizeByDispatching.bind(this), 500, {
        leading: true,
        trailing: true
      })
      /* invoke resize event at most twice per second to let redraws catch up
      Could also be _.debounce for 'wait until resize stops'
      */
    );

    /* secondly, parse URL, set URL, load data etc
    we're always going to load data here, it's just a question of what data to load!
    NOTE because the page has just loaded, there is no state to clear, we simply load
    new bits of state via the URL query and then URL pathname
    */
    // console.log("CDM")
    restoreStateFromURL(this.context.router, this.props.dispatch);
    const data_path = turnURLtoDataPath(this.context.router);
    if (data_path) {
      this.props.dispatch({type: NEW_DATASET, data: this.context.router.location.pathname});
      this.props.dispatch(loadJSONs(data_path));
    } else {
      console.log("<app> couldn't work out the dataset to load. Bad.");
    }
  }

  componentDidUpdate() {
    /* back/forward buttons used (i.e. app doesn't reload, things don't
    remount, but we still have to pick up URL changes)
    */
    // console.log("app.js CDU")
    // console.log("redux datasetPathName:", this.props.datasetPathName);
    // console.log("")
    // this.maybeFetchDataset();
  }

  handleResizeByDispatching() {
    this.props.dispatch({
      type: BROWSER_DIMENSIONS,
      data: {
        width: window.innerWidth,
        height: window.innerHeight,
        docHeight: window.document.body.clientHeight
        /* background needs docHeight because sidebar creates
        absolutely positioned container and blocks height 100% */
      }
    });
  }

  /******************************************
   * HANDLE QUERY PARAM CHANGES AND ASSOCIATED STATE UPDATES
   *****************************************/

  changeRoute(pathname, query) {
    pathname = pathname.replace("!/", ""); // needed to assist with S3 redirects
    const prefix = (pathname === "" || pathname[0] === "/") ? "" : "/";
    const suffix = (pathname.length && pathname[pathname.length - 1] !== "/") ? "/?" : "?";
    const url = prefix + pathname + suffix + queryString.stringify(query);
    window.history.pushState({}, "", url);
    this.setState(Object.assign({location:{query, pathname}}));
  }

  currentFrequencies() {
    let freq = "";
    if (this.props.colorBy && this.props.colorBy.slice(0,3) === "gt-") {
      const gt = this.props.colorBy.slice(3).split("_");
      freq = "global_" + gt[0] + ":" + gt[1];
    }
    return freq;
  }

  render() {
    return (
      <Sidebar
        sidebar={
          <Controls
            changeRoute={this.changeRoute.bind(this)}
            location={this.state.location}
            router={this.context.router}
            colorOptions={this.props.colorOptions}
          />
        }
        open={this.state.sidebarOpen}
        docked={this.state.sidebarDocked}
        onSetOpen={(a) => {this.setState({sidebarOpen: a});}}>
        <Background>
          <ToggleSidebarTab
            open={this.state.sidebarDocked}
            handler={() => {this.setState({sidebarDocked: !this.state.sidebarDocked});}}
          />
          <Header/>
          <TreeView
            query={queryString.parse(this.context.router.location.search)}
            sidebar={this.state.sidebarOpen || this.state.sidebarDocked}
          />
          <Map
            sidebar={this.state.sidebarOpen || this.state.sidebarDocked}
            nodes={this.props.tree.nodes}
            justGotNewDatasetRenderNewMap={false}
            />
          <Frequencies
            genotype={this.currentFrequencies()}
          />
          <Entropy
            sidebar={this.state.sidebarOpen || this.state.sidebarDocked}
            location={this.state.location}
            router={this.context.router}
          />
        </Background>
      </Sidebar>
    );
  }
}

export default App;
