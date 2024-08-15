import { useState, useEffect, Component } from 'react'
import './index.css'
import Territory from './Territory.jsx';
import Gantt from './Gantt.jsx';
import LegendElement from './legendElement.jsx';
import { MapContainer, LayerGroup, Marker, useMapEvents, ImageOverlay, Popup} from 'react-leaflet'
import { divIcon, CRS } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

const DEFAULT_YEAR = 6;
const VALID_YEARS = [6,7];

let currentYearJson = null;

const DEFAULT_PRECEDENCE = "N/A by territory";

const HORIZONTAL_SCALE_FACTOR = 1.3;
const VERTICAL_SCALE_FACTOR = 0.8;

let weeksScrollPosition = 0;

let storedTerritoryFontSize = "1em";

let canvas = document.createElement("canvas");
canvas.width = 1920;
canvas.height = 1080;

let isReady = false;

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
  let [windowFontSize,setWindowFontSize] = useState("1em");
  let [alternator,setAlternator] = useState(false); //alternator only exists so that we can toggle its truthiness from elsewhere, which arbitrarily triggers a rerender on components that have 'alternator' as a prop

    function changeWindowFontSize(){
      setWindowFontSize((window.innerWidth < 1000 ? (window.innerWidth/2500) : (window.innerWidth/1920)) +"em");
    }

    useEffect(() => { //Only runs after initial render
      changeYear(DEFAULT_YEAR);
      changeWindowFontSize();
    }, []); //ignore intelliense and keep this empty array; it makes this useEffect run only after the very first render, which is intended behaviour

    async function changeYear(newYearNumber){

      if (year == newYearNumber){
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

      let filename = "./json/y"+newYearNumber+".json";
      await fetch(filename)
          .then(response => response.json())
          .then(json => {
            if (json != ""){
              currentYearJson = json;
              highestWeekFound = json.weeks.length;
              json.weeks.forEach((week, weekIndex) => {
                week.territoryChanges.forEach((territoryChange) => { //Some one-off input sanitising on first load
                  territoryChange.alignment = adjustClanOrCovenantSpelling(territoryChange.alignment);
                  territoryChange.flipside = territoryChange.flipside == null ? adjustClanOrCovenantSpelling(territoryChange.alignment) : adjustClanOrCovenantSpelling(territoryChange.flipside);
                  territoryChange.posX = territoryChange.posX == null ? null : parseFloat(territoryChange.posX.replace("%",""));
                  territoryChange.posY = territoryChange.posY == null ? null : parseFloat(territoryChange.posY.replace("%",""));
                  territoryChange.maxHolderLineLength = parseFloat(territoryChange.maxHolderLineLength);                  
                });
                newLoadedWeeks.push({weekNumber:weekIndex+1, title:"Week "+(weekIndex+1)+" - "+week.title});
              });
            }
          });

      setYear(newYearNumber);
      changeWeek(highestWeekFound);
      redrawCanvasAccordingToWeek(highestWeekFound);
      updatePrecedence(highestWeekFound);
      setLoadedWeeks(newLoadedWeeks);
      isReady = true;
    }

    function cycleYear(){
      let index = VALID_YEARS.indexOf(year);
      if (index < VALID_YEARS.length - 1){
        index++;
      } else {
        index = 0;
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

    function redrawCanvasAccordingToWeek(week){

      if (canvas == null){
        return;
      }

      setAdjacencies(adjacencies);
      let ctx = canvas.getContext("2d");
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
          <h2 onClick={()=>{if(isReady){cycleYear();}}} className="panelBox" style={{marginLeft:'0em', marginTop:'0.75em', textAlign:"center", marginBottom:'0.5em',
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
            <div id="pastWeeks" className="panelBox">
              <h2 style={{whiteSpace:"nowrap", fontSize:window.innerWidth < 1000 ? "0.8em": "1.06em"}}>
                {window.innerWidth < 1000 ? "Select past week:" : "Select past week"}
              </h2>
              <hr/>
              <div className="weeksScroll" id="weeks-scroll-mobile">
                <>{loadedWeeks.map((wk) => <><h4 className={"weekOption"+ (wk.weekNumber == week ? " selected" : "")}
                                                 onClick={() => { 
                                                    let existingWeeksScrollElement = window.innerWidth > 1000 ? document.getElementById("pastWeeks") : document.getElementById("weeks-scroll-mobile");
                                                    weeksScrollPosition = existingWeeksScrollElement == null ? 0 : existingWeeksScrollElement.scrollTop;
                                                    week != wk.weekNumber ? changeWeek(wk.weekNumber) : null;
                                                    }}>
                                                {window.innerWidth > 1000 ? wk.title : "Wk"+wk.weekNumber}
                                            </h4></>)}</>
              </div>
              {
                screen.orientation.type.includes("landscape") ? 
                <>
                  <br/><br/><br/><br/><br/><br/><br/>
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
          html:"<div style=font-size:"+territoryFontSize+";>"+
          (
          props.t.useFlipside ? 
          renderToStaticMarkup(<Territory fadedOut={highlightedCategory == null ? false : (!props.t.flipside.includes(highlightedCategory))} t={props.t}/>)
          :
          renderToStaticMarkup(<Territory fadedOut={highlightedCategory == null ? false : (!props.t.alignment.includes(highlightedCategory))} t={props.t}/>)
          )
          +"</div>"
            })
        } style={{fontSize:10}}>
          <Popup>
            <Gantt t={props.t} weeks={currentYearJson.weeks} refreshFunc={() => {setAlternator(!alternator)}}/>
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
              <h1 onClick={()=>{if(isReady){cycleYear();}}} style={window.innerWidth < 1000 ? {display:"none"}: {}}>
                {window.innerWidth > 1000 ? ("Territory Map History" + (year==DEFAULT_YEAR || year <= 0 ? "" : " (Y"+year+")")) : "I recommend you use this on PC instead!"}
              </h1>
              <div onMouseEnter={() => {setHighlightedCategory(null)}} style={{height:'100%'}}>
                <MapContainer style={{height:"100%", maxWidth:"100vw", backgroundColor:'#ffffff', borderTop:"1px solid #ddd"}}
                                      center={mapCentre} zoom={10} crs={CRS.Simple} zoomDelta={0.5} minZoom={8} maxZoom={10.5}>
                  {
                  isReady
                    ?                  
                    <>
                      <LayerGroup>
                        <ImageOverlay
                          url={canvas.toDataURL()}
                          bounds={[[-VERTICAL_SCALE_FACTOR,0],[0,HORIZONTAL_SCALE_FACTOR]]}
                          opacity={0.5}
                          zIndex={10}
                        />
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