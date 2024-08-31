import { useState, useEffect, Component } from 'react'
import './index.css'
import Territory from './Territory.jsx';
import Gantt from './Gantt.jsx';
import LegendElement from './legendElement.jsx';
import WeekTitle from "./WeekTitle.jsx";
import { MapContainer, LayerGroup, Marker, useMapEvents, ImageOverlay, Popup} from 'react-leaflet'
import { divIcon, CRS } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

const DEFAULT_YEAR = 6;
const VALID_YEARS = [5,6,7];
const LOWEST_YEAR_IF_NOT_SHIFT_CLICKING = 6;

let currentYearJson = null;

const DEFAULT_PRECEDENCE = "N/A by territory (all tied)";

let HORIZONTAL_SCALE_FACTOR = 1.3;
let VERTICAL_SCALE_FACTOR = 0.8;

const EDIT_MODE = false;

let edit_mode_new_adjacency_first_coord = null;

if (EDIT_MODE){
  alert("Warning: Edit mode is active.\n\nControls:\nClick on the map to create a territory in that location\n\nCtrl-click to load a custom image as the canvas background (intended to be used as a guide, also please use 1920 by 1080 and letterbox if necessary!)\n\nAlt-click somewhere to start an adjacency and alt-click again in a new location to end it.\n\nShift-click to dump to JSON on the console.\n\nThe visuals will often lag behind your changes and require you to toggle the week to update (year change won't count and will erase your changes!), so I recommend having a dummy second week that you can toggle to. Your changes only affect the first week, as any subsequent updates after the initial positioning of territories can easily be made via manual JSON edits.")
}

let MAP = null;

let weeksScrollPosition = 0;

let specialCSS = null;

let storedTerritoryFontSize = "1em";

let canvas = document.createElement("canvas");
canvas.width = 1920;
canvas.height = 1080;

let customCanvasBackground = null;

let isReady = false;

let territorySize = "1em";

window.onresize = ()=>{
  if (window.innerWidth > window.innerHeight){
    document.body.style = "font-size:"+(window.innerWidth / 1920 * 16)+"px";
  } else {
    document.body.style = "font-size:16px";
  }
};

if (window.innerWidth > window.innerHeight){
  window.onresize();
}

function deepCopyJSON(json){
  return JSON.parse(JSON.stringify(json));
}

class Adjacency {
  constructor(adjacencyChange){
      this.adjacencyName = adjacencyChange.adjacencyName;
      this.refresh(adjacencyChange)
  }

  refresh(adjacencyChange){
    this.adjacencyName = adjacencyChange.adjacencyName;

    this.x1 = parseFloat(adjacencyChange.x1)
    this.y1 = parseFloat(adjacencyChange.y1)
    this.x2 = parseFloat(adjacencyChange.x2)
    this.y2 = parseFloat(adjacencyChange.y2)

    if (adjacencyChange.sideOrTop1 == "side"){
      this.a1 = (this.x1 + this.x2) / 2
      this.b1 = this.y1;
    } else {
      this.a1 =  this.x1;
      this.b1 = (this.y1 + this.y2) / 2;
    }

    if (adjacencyChange.sideOrTop2 == "side"){
      this.a2 = (this.x1 + this.x2) / 2
      this.b2 = this.y2;
    } else {
      this.a2 = this.x2;
      this.b2 = (this.y1 + this.y2) / 2;
    }
  }
}

function App (props){

  let [territories,setTerritories] = useState([]);
  let [adjacencies,setAdjacencies] = useState([]);
  let [year,setYear] = useState(-1);
  let [week,setWeek] = useState(-1);
  let [weekTitle,setWeekTitle] = useState("");
  let [loadedWeeks,setLoadedWeeks] = useState([]);
  let [clanPrecedence,setClanPrecedence] = useState(DEFAULT_PRECEDENCE);
  let [covenantPrecedence,setCovenantPrecedence] = useState(DEFAULT_PRECEDENCE);
  let [highlightedCategory,setHighlightedCategory] = useState(null);
  let [windowFontSize,setWindowFontSize] = useState("1em"); //this exists for mobile adjustment purposes
  let [alternator,setAlternator] = useState(false); //alternator only exists so that we can toggle its truthiness from elsewhere, which arbitrarily triggers a rerender on components that have 'alternator' as a prop

    function changeWindowFontSize(){
      setWindowFontSize((window.innerWidth < 1000 ? (window.innerWidth/2500) : (window.innerWidth/1920)) +"em");
    }

    useEffect(() => { //Only runs after initial render
      changeYear(DEFAULT_YEAR);
      changeWindowFontSize();
    }, []); //ignore intelliense and keep this empty array; it makes this useEffect run only after the very first render, which is intended behaviour
    
    async function changeYear(newYearNumber){

      if (!EDIT_MODE && year == newYearNumber){
        console.log("Did not attempt to change year, because that year was already selected.");
        return;
      }
      isReady = false;
      weeksScrollPosition = 0;

      let newLoadedWeeks = [];
      let highestWeekFound = -1;

      while (territories.length > 0){
        territories.pop();
      }

      while (adjacencies.length > 0){
        adjacencies.pop();
      }      

      let filename = "./json/y"+newYearNumber+".json";
      await fetch(filename)
          .then(response => response.json())
          .then(json => {
            if (json != ""){
              currentYearJson = json;
              highestWeekFound = json.weeks.length;
              HORIZONTAL_SCALE_FACTOR = json.HORIZONTAL_SCALE_FACTOR;
              VERTICAL_SCALE_FACTOR = json.VERTICAL_SCALE_FACTOR;
              specialCSS = json.specialTerritoryCSS;
              territorySize = json.territorySize;
              json.weeks.forEach((week, weekIndex) => {
                week.territoryChanges.forEach((territoryChange) => { //Some one-off input sanitising on first load
                  territoryChange.alignment = adjustClanOrCovenantSpelling(territoryChange.alignment);
                  territoryChange.flipside = territoryChange.flipside == null ? adjustClanOrCovenantSpelling(territoryChange.alignment) : adjustClanOrCovenantSpelling(territoryChange.flipside);
                  territoryChange.posX = territoryChange.posX == null ? null : parseFloat(typeof territoryChange.posX === "string" ? territoryChange.posX.replace("%","") : territoryChange.posX);
                  territoryChange.posY = territoryChange.posY == null ? null : parseFloat(typeof territoryChange.posY === "string" ? territoryChange.posY.replace("%","") : territoryChange.posY);
                  territoryChange.maxHolderLineLength = parseFloat(territoryChange.maxHolderLineLength);                  
                });
                newLoadedWeeks.push({weekNumber:weekIndex+1, title:week.title});
              });
            }
          });
      setYear(newYearNumber);
      changeWeek(highestWeekFound);
      redrawCanvasAccordingToWeek(highestWeekFound);
      updatePrecedence(highestWeekFound);
      setLoadedWeeks(newLoadedWeeks);
      if (MAP != null){
        MAP.setView([-0.5 * VERTICAL_SCALE_FACTOR, 0.5 * HORIZONTAL_SCALE_FACTOR], 13 / HORIZONTAL_SCALE_FACTOR < 9.2 ? 9.2 : 13 / HORIZONTAL_SCALE_FACTOR)
      }
      isReady = true;
    }

    let imageOverlay = null;
    refreshImageOverlay();

    function cycleYear(shiftKey){
      let index = VALID_YEARS.indexOf(year);
      let useLowerBarrier = !shiftKey && VALID_YEARS.includes(LOWEST_YEAR_IF_NOT_SHIFT_CLICKING);

      if (index > (useLowerBarrier ? VALID_YEARS.indexOf(LOWEST_YEAR_IF_NOT_SHIFT_CLICKING) : 0)){
        index--;
      } else {
        index = VALID_YEARS.length - 1;
      }
      changeYear(VALID_YEARS[index]);
    }

    function changeWeek(newWeekNumber){    
      redrawCanvasAccordingToWeek(newWeekNumber);
      setTerritoriesFromJSON(currentYearJson, newWeekNumber)
      setWeek(newWeekNumber);
      updatePrecedence();
    }

    function updatePrecedence(){
      let dict = {};
      let highestClan = DEFAULT_PRECEDENCE;
      let highestClanNumber = 0;
      let maxConcurrentClans = 0;

      let highestCovenant = DEFAULT_PRECEDENCE;
      let highestCovenantNumber = 0;
      let maxConcurrentCovenants = 0;

      for (let i = 0; i < territories.length; i++){
        let t = territories[i];

        let alignment = null;
        if (t.useFlipside && t.flipside != null){
          alignment = t.flipside.split(" "); //in case the territory is contested, because it would be (e.g.) "daeva contested" and thus needs to count as just "daeva"
        } else {
          alignment = t.alignment.split(" "); //in case the territory is contested, because it would be (e.g.) "daeva contested" and thus needs to count as just "daeva"
        }

        if (alignment[0] in dict){
          dict[alignment[0]]++;
        } else {
          dict[alignment[0]] = 1;
        }
      }

      for (let i = 0; i < Object.keys(dict).length; i++){
        let key = Object.keys(dict)[i];
        if (isClan(key)){
          if (dict[key] == highestClanNumber){
            highestClan += " vs "+ toTitleCase(key);
            maxConcurrentClans++;
          } else if (dict[key] > highestClanNumber){
            highestClan = toTitleCase(key);
            highestClanNumber = dict[key];
            maxConcurrentClans = 1;
          }
        } else if (isCovenant(key)){
          if (dict[key] == highestCovenantNumber){
            highestCovenant += " vs "+ toTitleCase(key);
            maxConcurrentCovenants++;
          } else if (dict[key] > highestCovenantNumber){
            highestCovenant = toTitleCase(key);
            highestCovenantNumber = dict[key];
            maxConcurrentCovenants = 1;
          }
        }
      }

      if (maxConcurrentClans >= 5){
        highestClan = DEFAULT_PRECEDENCE;
      }
      if (maxConcurrentCovenants >= 5){
        highestCovenant = DEFAULT_PRECEDENCE;
      }

      setClanPrecedence(highestClan);
      setCovenantPrecedence(highestCovenant);
    }

    function ClanCovPrecedence(props){
      return (
      <div style = {screen.orientation.type.includes("portrait") ? {maxHeight:"4em", overflowY:"auto"} : {}} onMouseEnter={() => {setHighlightedCategory(null)}}>
        <div style = {screen.orientation.type.includes("portrait") ? {display:"inline-block"} : {}}>
          <h2 style={{width:"fit-content", maxWidth:"100%", marginRight:"2em", fontSize:window.innerWidth < 1000 ? "0.8em": "1.06em"}}>
            Clan precedence:
          </h2>
          <h2 style={{marginTop: "0.15em", marginRight:"0em", marginBottom: "1em", color:"black", whiteSpace:"break-spaces",
            width:"fit-content", fontSize:window.innerWidth < 1000 ? "0.8em": "0.9em"}}>
            {clanPrecedence}
          </h2>
        </div>
        <div style = {screen.orientation.type.includes("portrait") ? {display:"inline-block"} : {}}>
          <h2 style={{width:"fit-content", maxWidth:"100%", marginRight:0, fontSize:window.innerWidth < 1000 ? "0.8em": "1.06em"}}>
            Covenant precedence:
          </h2>
          <h2 style={{marginTop: "0.15em", marginRight:"0em", color:"black", width:"fit-content", whiteSpace:"break-spaces", fontSize:window.innerWidth < 1000 ? "0.8em": "0.9em"}}>
            {covenantPrecedence}
          </h2>
        </div>
      </div>
      );
    }

    function toTitleCase(input){
      let firstLetter = input.substr(0, 1);
      let restOfString = input.substr(1);
        
      return firstLetter.toUpperCase() + restOfString;
    }

    function adjustClanOrCovenantSpelling(input){
      input = input.toLowerCase();

      if (input == "nos"){
        input = "nosferatu";
      } else if (input == "carthians"){
        input = "carthian";
      } else if (input == "circle"){
        input = "crone";
      } else if (input == "ordo dracul"){
        input = "ordo";
      } else if (input == "vics"){
        input = "invictus";
      } else if (input == "lancea"){
        input = "lance";
      }
      return input;
    }

    function isClan(input){
      switch (input){
        case "ventrue":
        case "daeva":
        case "mekhet":
        case "gangrel":
        case "nosferatu":
          return true;
        default:
          return false;
      }
    }

    function isCovenant(input){
      switch (input){
        case "invictus":
        case "carthian":
        case "crone":
        case "lance":
        case "ordo":
          return true;
        default:
          return false;
      }
    }

      function getTerritoryByName(territoryName){
        for (let i = 0; i < territories.length; i++){
            let t = territories[i];
            if (t.territoryName == territoryName){
                return t;
            }
        }
        return null;
      }

      function getAdjacencyByName(adjacencyName){
        for (let i = 0; i < adjacencies.length; i++){
            let a = adjacencies[i];
            if (a.adjacencyName == adjacencyName){
                return a;
            }
        }
        return null;
      }

      function setTerritoriesFromJSON(json, requiredWeek){

          //process all the weeks up until that point too, so that we get the combined result of all the changes up to that point.
         //it's fine that requiredWeek is actually one more than the index of that week; it cancels out nicely with being the upper bound in the for loop.

          for (let i = 0; i < requiredWeek; i++){
              let week = json.weeks[i];

              week.territoryChanges.forEach((territoryChange) => {
                  let alreadyExistingVersion = getTerritoryByName(territoryChange.territoryName);
                  if (alreadyExistingVersion == null){   //then push a new one       
                      let freshCopy = deepCopyJSON(territoryChange);             
                      freshCopy.useFlipside = false;  
                      territories.push(freshCopy); //but ensure a deep copy if pushing this territory for the first time. Otherwise it would gradually degrade the ground truth data.
                  } else {    //then just update its properties
                    alreadyExistingVersion.alignment = territoryChange.alignment;
                    alreadyExistingVersion.flipside = territoryChange.flipside == null ? territoryChange.alignment : territoryChange.flipside;
                    alreadyExistingVersion.holder = territoryChange.holder;
                    if (territoryChange.posX != null){
                      alreadyExistingVersion.posX = territoryChange.posX;
                    }
                    if (territoryChange.posY != null){
                      alreadyExistingVersion.posY = territoryChange.posY;
                    }
                    alreadyExistingVersion.maxHolderLineLength = territoryChange.maxHolderLineLength;
                  }
              });

              week.adjacencyChanges.forEach((adjacencyChange) => {
                let alreadyExistingVersion = getAdjacencyByName(adjacencyChange.adjacencyName);
                if (alreadyExistingVersion == null){   //then push a new one
                    adjacencies.push(new Adjacency(deepCopyJSON(adjacencyChange)));
                } else {    //then just update its properties
                  alreadyExistingVersion.refresh(adjacencyChange);
                }
              });
            }
          setWeekTitle(json.weeks[requiredWeek-1].title);
        }

    function loadCustomCanvasBackground(file){
          let reader = new FileReader();
            
          reader.readAsDataURL(file);
            
          reader.onload = function() {
            console.log(reader.result);
            customCanvasBackground = new Image();
            customCanvasBackground.src = reader.result;
            redrawCanvasAccordingToWeek(-1);
            setWeekTitle(String(Date.now()));
            alert("The background might be a bit shy, but should appear on the next canvas redraw!")
          };
            
          reader.onerror = function() {
            console.log(reader.error);
          };
    }

    function handleSpecialMapClick(e){
          if (e.originalEvent.altKey){
              if (edit_mode_new_adjacency_first_coord == null){
                edit_mode_new_adjacency_first_coord = [e.latlng.lng / HORIZONTAL_SCALE_FACTOR / 0.01, -(e.latlng.lat / VERTICAL_SCALE_FACTOR / 0.01)];
              } else {
                let secondCoord = [e.latlng.lng / HORIZONTAL_SCALE_FACTOR / 0.01, -(e.latlng.lat / VERTICAL_SCALE_FACTOR / 0.01)];
                let nameForAdjacency = prompt("Name for this adjacency?");
                let newAdjacencyChange = {"adjacencyName":nameForAdjacency, "x1":edit_mode_new_adjacency_first_coord[0], "y1":edit_mode_new_adjacency_first_coord[1], "x2":secondCoord[0], "y2":secondCoord[1], "sideOrTop1":"side", "sideOrTop2":"side"};
                currentYearJson.weeks[0].adjacencyChanges.push(newAdjacencyChange);
                refreshImageOverlay();
                setAlternator(!alternator); 
                changeWeek(1);
                setWeekTitle(String(Date.now()))
                edit_mode_new_adjacency_first_coord = null;
              }
          }
          else if (e.originalEvent.ctrlKey){
            let fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/png";
            fileInput.click();
            fileInput.oninput = (fileInputEvent) => {loadCustomCanvasBackground(fileInputEvent.target.files[0])};
          } else if (e.originalEvent.shiftKey){
            dumpJSON();  
            alert("JSON dumped to console.");          
          } else {
            let name = prompt("Name for this territory?");
            if (name != null){
              let newTerritoryChange = {"territoryName":name, "alignment":"unclaimed", "holder":"Unclaimed",
                "posX":(e.latlng.lng / HORIZONTAL_SCALE_FACTOR / 0.01), "posY":-(e.latlng.lat / VERTICAL_SCALE_FACTOR / 0.01),
                "maxHolderLineLength":"0"};
                currentYearJson.weeks[0].territoryChanges.push(newTerritoryChange);
                setAlternator(!alternator); 
                changeWeek(1);
                setWeekTitle(String(Date.now()))
            }
          }    
    }

    function dumpJSON(){
      console.log(JSON.stringify(currentYearJson).replaceAll("[","[\n").replaceAll("},","},\n").replaceAll("]","\n]"));
    }

    function redrawCanvasAccordingToWeek(week){

      if (canvas == null){
        return;
      }

      let ctx = canvas.getContext("2d");

      if (customCanvasBackground != null){
        ctx.drawImage(customCanvasBackground,0,0,1920,1080);
        return;
      }

      setAdjacencies(adjacencies);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#505050";
      ctx.lineWidth = 1.5;
    
      for (let i = 0; i < adjacencies.length; i++){
        let a = adjacencies[i];

        ctx.beginPath();        
        ctx.moveTo((a.x1/100) * canvas.width, (a.y1/100) * canvas.height);
        ctx.bezierCurveTo((a.a1/100) * canvas.width, (a.b1/100) * canvas.height,
                          (a.a2/100) * canvas.width, (a.b2/100) * canvas.height, 
                          (a.x2/100) * canvas.width, (a.y2/100) * canvas.height);
        ctx.stroke();
        }
      refreshImageOverlay();
    }

    function refreshImageOverlay(){
      imageOverlay = <ImageOverlay
                        notify={imageOverlay == null ? true : !imageOverlay.props.notify}
                        url={canvas.toDataURL()}
                        bounds={[[-VERTICAL_SCALE_FACTOR,0],[0,HORIZONTAL_SCALE_FACTOR]]}
                        opacity={0.5}
                        zIndex={10}
                      />;
    }

    class Panel extends Component {

      componentDidMount() {
        let existingWeeksScrollElement =  window.innerWidth > 1000 ? document.getElementById("pastWeeks") : document.getElementById("weeks-scroll-mobile");
        if (existingWeeksScrollElement != null){
          existingWeeksScrollElement.scrollTop = weeksScrollPosition;
          }
      }
  
      render() {
        return (<div id="panel">
          <h2 onClick={(e)=>{if(isReady){cycleYear(e.shiftKey);}}} className="panelBox" style={{marginLeft:'0em', marginTop:'0.75em', textAlign:"center", marginBottom:'0.5em',
            color:"rgb(50,50,50)", width:"100%", height:"fit-content", display:window.innerWidth < 1000 ? 'inherit' : 'none'}}>
            {"Territory Map History" + (year==DEFAULT_YEAR || year <= 0 ? "" : " (Y"+year+")")}
          </h2>
          <div id="panelFlex" className="flex" >
            <div id="legend" className="panelBox" style={{height:"fit-content"}}>
              <h2 style={{fontSize:window.innerWidth < 1000 ? "0.8em": "1.06em"}}>
                Legend
              </h2>
              <hr/>
              <div onMouseLeave={() => {setHighlightedCategory(null)}} id="key" style={{overflow:'auto', width:"fit-content"}}>
                <div onMouseLeave={() => {setHighlightedCategory(null)}}>
                  <div className="legend-territories-row">
                    <LegendElement alignment="Ventrue" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Daeva" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Mekhet" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Gangrel" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Nosferatu" setHighlightedCategory={setHighlightedCategory}/>
                  </div>
                  <div className="legend-territories-row" style={{marginTop:"0.25em"}}>
                    <LegendElement alignment="Invictus" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Carthian" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Lance" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Crone" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Ordo" setHighlightedCategory={setHighlightedCategory}/>
                  </div>
                </div>
                <div className="legend-territories-row" style={{marginTop:"0.5em"}} onMouseLeave={() => {setHighlightedCategory(null)}}>
                  <LegendElement alignment="Court" setHighlightedCategory={setHighlightedCategory}/>
                  <LegendElement alignment="Personal" setHighlightedCategory={setHighlightedCategory}/>
                  <LegendElement alignment="Enemy" setHighlightedCategory={setHighlightedCategory}/>
                  <LegendElement alignment="Unclaimed" setHighlightedCategory={setHighlightedCategory}/>
                </div>
              </div>
              <br/>
              {window.innerWidth >= 1000 ? <ClanCovPrecedence/> : <></>}
            </div>
            {
              window.innerWidth >= 1000 ?
              <>
              <h2 style={{marginTop:"1em", whiteSpace:"nowrap", fontSize:window.innerWidth < 1000 ? "0.8em": "1.06em"}}>
                {window.innerWidth < 1000 ? "Select past week:" : "Select past week"}
              </h2>
              <hr/>
              </>
            : 
            <></>
            }
            <div id="pastWeeks" className="panelBox">
              {
                window.innerWidth < 1000 ?
                <>
                <h2 style={{whiteSpace:"nowrap", fontSize:window.innerWidth < 1000 ? "0.8em": "1.06em"}}>
                  {window.innerWidth < 1000 ? "Select past week:" : "Select past week"}
                </h2>
                <hr/>
                </>
              : 
              <></>
              }
              <div className="weeksScroll" id="weeks-scroll-mobile">
                <>{loadedWeeks.map((wk) => <><h4 className={"weekOption"+ (wk.weekNumber == week ? " selected" : "")}
                                                 onClick={() => { 
                                                    let existingWeeksScrollElement = window.innerWidth > 1000 ? document.getElementById("pastWeeks") : document.getElementById("weeks-scroll-mobile");
                                                    weeksScrollPosition = existingWeeksScrollElement == null ? 0 : existingWeeksScrollElement.scrollTop;
                                                    week != wk.weekNumber ? changeWeek(wk.weekNumber) : null;
                                                    }}>
                                                {window.innerWidth > 1000 ? <WeekTitle number={wk.weekNumber} title={wk.title}/> : "Wk"+wk.weekNumber}
                                            </h4></>)}</>
              </div>
              {
                screen.orientation.type.includes("landscape") ? 
                <>
                  <br/><br/><br/><br/>
                </>
                : null
              }
            </div>
          </div>
          {window.innerWidth < 1000 ? <ClanCovPrecedence/> : <></>}
      </div>
      );
      }
    }

    function MapTerritory(props) {
      let [territoryFontSize, setTerritoryFontSize] = useState(storedTerritoryFontSize);
    
      const mapEvents = useMapEvents({
          zoomend: () => {
            storedTerritoryFontSize = (1 - ((10 - mapEvents.getZoom()) / 3)) + "em";
            setTerritoryFontSize(storedTerritoryFontSize);
          },
      });

      return (
      <Marker position={props.position} icon={
        divIcon({
          html:"<div style='font-size:"+territoryFontSize+"; pointer-events:"+(EDIT_MODE ? "none" : "all")+"'>"+
          (
          props.t.useFlipside ? 
          renderToStaticMarkup(<Territory specialCSS={specialCSS} tSize={territorySize} fadedOut={highlightedCategory == null ? false : (!props.t.flipside.includes(highlightedCategory))} t={props.t}/>)
          :
          renderToStaticMarkup(<Territory specialCSS={specialCSS} tSize={territorySize} fadedOut={highlightedCategory == null ? false : (!props.t.alignment.includes(highlightedCategory))} t={props.t}/>)
          )
          +"</div>"
            })
        } >
          <Popup>
            <Gantt t={props.t} weeks={currentYearJson.weeks} refreshFunc={() => {setAlternator(!alternator);  updatePrecedence();}}/>
          </Popup>
          </Marker>
      );
    }

    let mapCentre = [-0.5 * VERTICAL_SCALE_FACTOR, 0.5 * HORIZONTAL_SCALE_FACTOR];

    return (
    <>
        <div className="bigFlex">
        {window.innerWidth < 1000 ? <Panel/> : <></>}
          <div id="displayParent" style={{fontSize:windowFontSize, width:"100%", height:"100%"}}>
              <h1 onClick={(e)=>{if(isReady){cycleYear(e.shiftKey);}}} style={window.innerWidth < 1000 ? {display:"none"}: {}}>
                {window.innerWidth > 1000 ? ("Territory Map History" + (year==DEFAULT_YEAR || year <= 0 ? "" : " (Y"+year+")")) : "I recommend you use this on PC instead!"}
              </h1>
              <div onMouseEnter={() => {setHighlightedCategory(null)}} style={{height:'100%'}}>
                <MapContainer style={{height:"100%", maxWidth:"100vw", backgroundColor:'#ffffff', borderTop:"1px solid #ddd"}}
                                      center={mapCentre} zoom={10} crs={CRS.Simple} zoomDelta={0.5} minZoom={8} maxZoom={10.5}
                                      whenReady={(map) => {MAP = map.target; map.target.on("click", function (e) {if (EDIT_MODE){handleSpecialMapClick(e);}});}}>
                  {
                  isReady
                    ?                  
                    <>
                      <LayerGroup>
                        {imageOverlay}
                      </LayerGroup>
                      <LayerGroup>
                        {territories.map((t) => <>
                        <MapTerritory alternator={alternator} position={[-t.posY * 0.01 * VERTICAL_SCALE_FACTOR, t.posX * 0.01 * HORIZONTAL_SCALE_FACTOR]} t={t}/>
                        </>)}
                      </LayerGroup>
                    </>
                    : 
                    <Marker icon={divIcon({html:"<div></div>"})} position={mapCentre}>
                        <h1 style={{marginTop: "2em", position:"absolute", top:"35%", textAlign:"center", width:"100%", display:"inherit", zIndex:"0"}}>
                          Loading... <br/>(If it hasn't loaded after five seconds, check the JSON syntax)
                        </h1>
                    </Marker>
                  }
                </MapContainer>
              </div>
          </div>
          {window.innerWidth >= 1000 ? <Panel/> : <></>}
        </div>
    </>
  )
}

export default App