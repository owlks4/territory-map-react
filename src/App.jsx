import { useState, useEffect } from 'react'
import './index.css'
import Territory from './Territory.jsx';
import LegendElement from './legendElement.jsx';
import { MapContainer, LayerGroup, Marker, useMapEvents } from 'react-leaflet'
import { divIcon, CRS } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

const DEFAULT_YEAR = 6;
const VALID_YEARS = [6,7];
const MAX_SPECULATIVE_CSV_CHECK_NUMBER = 30;  //as in, in any given year, it will look for a maximum of this many CSVs in the given folder. It should be a sensible limit that it is unlikely to ever reach, without being too high.
const DEFAULT_PRECEDENCE = "N/A by territory";

let isReady = false;

class Adjacency {
  constructor(week,x1,y1,x2,y2,sideOrTop1, sideOrTop2){
      this.week = week;
      this.x1 = parseFloat(x1);
      this.y1 = parseFloat(y1);
      this.x2 = parseFloat(x2);
      this.y2 = parseFloat(y2);

      if (sideOrTop1 == "side"){
        this.a1 = (this.x1 + this.x2) / 2
        this.b1 = parseFloat(y1);
      } else {
        this.a1 =  parseFloat(x1);
        this.b1 = (this.y1 + this.y2) / 2;
      }

      if (sideOrTop2 == "side"){
        this.a2 = (this.x1 + this.x2) / 2
        this.b2 = parseFloat(y2);
      } else {
        this.a2 =  parseFloat(x2);
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
      
      let newLoadedWeeks = [];
      let highestWeekFound = -1;
    
      for (let i = 1; i < MAX_SPECULATIVE_CSV_CHECK_NUMBER; i++){
        let shouldBreakLoop = false;
        await fetch("./csv/y"+newYearNumber+"/territoryAssignments-wk"+i+".csv")
        .then(response => response.text())
        .then(text => {
          if (text != "" && text[0] != "<"){
            let lines = text.trim().split("\n");
            newLoadedWeeks.push({title: "Week "+i+" - "+lines[0], weekNumber:i, minX:null, maxX:null, minY:null, maxY:null});
            getTerritoriesFromCSV(lines, i);
            if (i > highestWeekFound){
              highestWeekFound = i;
            }
          } else {
            shouldBreakLoop = true;
          }
        });
        if (shouldBreakLoop){
          break;
        }
      }
      newLoadedWeeks = newLoadedWeeks.sort((a, b) => a.weekNumber - b.weekNumber)
      setYear(newYearNumber);
      setWeek(highestWeekFound);
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
      setWeek(newWeekNumber);
      updatePrecedence(newWeekNumber);
    }

    function updatePrecedence(newWeekNumber){
      let dict = {};
      let highestClan = DEFAULT_PRECEDENCE;
      let highestClanNumber = 0;
      let maxConcurrentClans = 0;

      let highestCovenant = DEFAULT_PRECEDENCE;
      let highestCovenantNumber = 0;
      let maxConcurrentCovenants = 0;

      for (let i = 0; i < territories.length; i++){
        let t = territories[i];
        if (t.week == newWeekNumber){
          let alignment = t.alignment.split(" "); //in case the territory is contested, because it would be (e.g.) "daeva contested" and thus needs to count as just "daeva"
          if (alignment[0] in dict){
            dict[alignment[0]]++;
          } else {
            dict[alignment[0]] = 1;
          }
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
      return (<div>
                        <div style = {screen.orientation.type.includes("portrait") ? {display:"inline-block"} : {}}>
                          <h2 style={{width:"fit-content", maxWidth:"100%", marginRight:"2em", fontSize:window.innerWidth < 1000 ? "0.8em": "1.06em"}}>
                            Clan precedence:
                          </h2>
                          <h2 style={{marginTop: "0.15em", marginRight:"0em", marginBottom: "1em", color:"black",
                                      whiteSpace:"break-spaces", width:"fit-content", fontSize:window.innerWidth < 1000 ? "0.8em": "0.9em"}}>
                            {clanPrecedence}
                          </h2>
                        </div>
                        <div style = {screen.orientation.type.includes("portrait") ? {display:"inline-block"} : {}}>
                          <h2 style={{width:"fit-content", maxWidth:"100%", marginRight:0, fontSize:window.innerWidth < 1000 ? "0.8em": "1.06em"}}>
                            Covenant precedence:
                          </h2>
                          <h2 style={{marginTop: "0.15em", marginRight:"0em", color:"black", width:"fit-content", 
                                    whiteSpace:"break-spaces", fontSize:window.innerWidth < 1000 ? "0.8em": "0.9em"}}>
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

    function getTerritoriesFromCSV(lines, week){

      let line1Split = lines[1].split(",");
    
        setWeekTitle(lines[0]);
    
        for (let i = 3; i < lines.length; i++){
            let splitLine = lines[i].replaceAll("%","").split(",");
            if (splitLine[0].trim().includes("ADJ")){
              adjacencies.push(
                    new Adjacency(
                        week,
                        splitLine[1].trim(),
                        splitLine[2].trim(),
                        splitLine[3].trim(),
                        splitLine[4].trim(),
                        splitLine[5].trim(),
                        splitLine[6].trim()));
            } else {
                let t = {
                  name:splitLine[0].trim(),
                  alignment:adjustClanOrCovenantSpelling(splitLine[1].trim()),
                  holder:splitLine[2].trim(),
                  posX:splitLine[3].trim(),
                  posY:splitLine[4].trim(),
                  maxHolderLineLength:parseFloat(splitLine[5].trim()),
                  week:week
                }
                territories.push(t);
              }
          }
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
        if (a.week != week){
            continue;
          }
        ctx.beginPath();        
        ctx.moveTo((a.x1/100) * canvas.width, (a.y1/100) * canvas.height);
        ctx.bezierCurveTo((a.a1/100) * canvas.width, (a.b1/100) * canvas.height,
                          (a.a2/100) * canvas.width, (a.b2/100) * canvas.height, 
                          (a.x2/100) * canvas.width, (a.y2/100) * canvas.height);
        ctx.stroke();
        }
    }

    function Panel (){
      return (<div id="panel">
          <h2 className="panelBox" style={{marginLeft:'0em', marginTop:'0.75em', textAlign:"center", marginBottom:'0.5em',
            color:"rgb(50,50,50)", width:"100%", height:"fit-content", display:window.innerWidth < 1000 ? 'inherit' : 'none'}}>
            Territory Map History
            <br/>
            (Works better on PC)
          </h2>
          <div id="panelFlex" className="flex" >
            <div id="legend" className="panelBox" style={{height:"fit-content"}}>
              <h2 style={{fontSize:window.innerWidth < 1000 ? "0.8em": "1.06em"}}>
                Legend
              </h2>
              <hr/>
              <div id="key" style={{overflow:'auto', width:"fit-content"}}>
                <div onMouseLeave={() => {setHighlightedCategory(null)}}>
                  <div>
                    <LegendElement alignment="Ventrue" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Daeva" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Mekhet" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Gangrel" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Nosferatu" setHighlightedCategory={setHighlightedCategory}/>
                  </div>
                  <div style={{marginTop:"0.25em"}}>
                    <LegendElement alignment="Invictus" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Carthian" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Lance" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Crone" setHighlightedCategory={setHighlightedCategory}/>
                    <LegendElement alignment="Ordo" setHighlightedCategory={setHighlightedCategory}/>
                  </div>
                </div>
                <div style={{marginTop:"0.5em"}} onMouseLeave={() => {setHighlightedCategory(null)}}>
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
              <div className="weeksScroll">
                <>{loadedWeeks.map((wk) => <><h4 className={"weekOption"+ (wk.weekNumber == week ? " selected" : "")} onClick={() => week != wk.weekNumber ? changeWeek(wk.weekNumber) : null}>
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

    function MapTerritory(props) {
      let [territoryFontSize, setTerritoryFontSize] = useState(1);

      const mapEvents = useMapEvents({
          zoomend: () => {
              setTerritoryFontSize((1 - ((10 - mapEvents.getZoom()) / 3)) + "em");
          },
      });      

      return (
      <Marker position={props.position} icon={
        divIcon({
          html:"<div style=font-size:"+territoryFontSize+";>"+renderToStaticMarkup(
          <Territory fadedOut={highlightedCategory == null ? false : (!props.t.alignment.includes(highlightedCategory))} t={props.t}/>)+"</div>"
            })
        } style={{fontSize:10}}/>
      );
    }

    let mapCentre = [-0.5 * 0.85, 0.5 * 1.3];

    return (
    <>
        <div className="bigFlex">
        {window.innerWidth < 1000 ? <Panel/> : <></>}
          <div id="displayParent" style={{fontSize:windowFontSize, width:"100%", height:"100%"}}>
              <h1 onClick={()=>{cycleYear();}} style={window.innerWidth < 1000 ? {display:"none"}: {}}>
                {window.innerWidth > 1000 ? ("Territory Map History" + (year==DEFAULT_YEAR || year <= 0 ? "" : " ("+year+")")) : "I recommend you use this on PC instead!"}
              </h1>
              <div style={{height:'100%'}}>
                <MapContainer style={{height:"100%", backgroundColor:'#ffffff', borderTop:"1px solid #ddd"}}
                                      center={mapCentre} zoom={10} crs={CRS.Simple} zoomDelta={0.5} minZoom={8} maxZoom={10.5}>
                  {
                  isReady
                    ?                  
                    <LayerGroup>
                    {territories.map((t) => t.week == week ? (<>
                    <MapTerritory position={[-t.posY * 0.01 * 0.8, t.posX * 0.01 * 1.3]} t={t}/>
                    </>) : null)}
                    </LayerGroup>
                    : 
                    <Marker icon={divIcon({html:"<div></div>"})} position={mapCentre}>
                        <h1 style={{marginTop: "2em", position:"absolute", top:"35%", textAlign:"center", width:"100%", display:"inherit", zIndex:"0"}}>
                          Loading... <br/>(Should take about 5 seconds at most)
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