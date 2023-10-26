import { useState, useEffect } from 'react'
import './index.css'
import Territory from './Territory.jsx';
import LegendElement from './legendElement.jsx';

const DEFAULT_YEAR = 6;
const DEFAULT_WEEK = 1;
const SHOW_DEBUG_COORDS_IN_CENTRE = false;
const MAX_SPECULATIVE_CSV_CHECK_NUMBER = 30;  //as in, in any given year, it will look for a maximum of this many CSVs in the given folder. It should be a sensible limit that it is unlikely to ever reach, without being too high.

let isReady = false;
let mouseIsOverPanel = false;
let canvas = null;
let hasDrawnToCanvasForFirstTime = false;
let dragging = false;

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
  let [territoryLabelFontSize,setTerritoryLabelFontSize] = useState("1em");
  let [weekTitle,setWeekTitle] = useState("");
  let [displayTop,setDisplayTop] = useState(0);
  let [displayLeft,setDisplayLeft] = useState(window.innerWidth > 1000 ? -225 : -135);
  let [mapAdjustLeft,setMapAdjustLeft] = useState("54%");
  let [mapAdjustTop,setMapAdjustTop] = useState("40%");
  let [fontSizeEm,setFontSizeEm] = useState(0.89);
  let [loadedWeeks,setLoadedWeeks] = useState([]);
  let [weekBounds,setWeekBounds] = useState([]);
  let [highlightedCategory,setHighlightedCategory] = useState(null);
  let [windowFontSize,setWindowFontSize] = useState(window.innerWidth < window.innerHeight ? (window.innerHeight/1920) +"em" : (window.innerWidth/927) +"em");

  document.addEventListener('mousedown', (ev) => {dragging = (true && !mouseIsOverPanel)});
  document.addEventListener("mousemove", (ev) => {onMouseMove(ev)});
  document.addEventListener("mouseup", (ev) => {dragging = false;});
  document.addEventListener("wheel", (ev) => {let change = ev.deltaY/1000; (fontSizeEm - change > 0.5) && (fontSizeEm - change < 3) ? setFontSizeEm(fontSizeEm - change) : null;});
  window.addEventListener("resize", (ev) => {changeWindowFontSize()});

    function changeWindowFontSize(){
      console.log("w "+window.innerWidth);
      console.log("h "+window.innerHeight);
      setWindowFontSize(window.innerWidth < window.innerHeight ? (window.innerHeight/1920) +"em" : (window.innerHeight/927) +"em");
    }

    useEffect(() => { //Only runs after initial render
      changeYear(DEFAULT_YEAR);
      tryInitialiseCanvas();
      redrawCanvasAccordingToWeek(week);
      changeWindowFontSize();
    }, []); //ignore intelliense and keep this empty array; it makes this useEffect run only after the very first render, which is intended behaviour

    useEffect(() => {   //runs after render all the time, but only actually does anything once. It's required to get the canvas to realise it needs to redraw to display the adjacencies after the (async) territories are rendered
      tryInitialiseCanvas();
    });

    function onMouseMove(event) {
      if (dragging && isReady){
        tryInitialiseCanvas();
        setDisplayLeft(displayLeft + event.movementX);
        setDisplayTop(displayTop + event.movementY);
        setTerritories(territories);
      }
    }

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
      setLoadedWeeks(newLoadedWeeks);
      isReady = true;
    
      tryInitialiseCanvas();  
    }

    function changeWeek(newWeekNumber){    
      setWeek(newWeekNumber);
      redrawCanvasAccordingToWeek(newWeekNumber);
    }

    function getTerritoriesFromCSV(lines, week){

      let line1Split = lines[1].split(",");
    
        setWeekTitle(lines[0]);
        setTerritoryLabelFontSize(line1Split[0].trim());
        
        weekBounds.push({
          week: week,
          minX: parseFloat(line1Split[1].trim()),
          maxX: parseFloat(line1Split[2].trim()),
          minY: parseFloat(line1Split[3].trim()),
          maxY: parseFloat(line1Split[4].trim())});
    
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
                  alignment:splitLine[1].trim().toLowerCase(),
                  holder:splitLine[2].trim(),
                  emPosX:splitLine[3].trim(),
                  emPosY:splitLine[4].trim(),
                  week:week,
                  ref:null
                }
    
                territories.push(t);
              }
          }
      }

    function getCurrentWeekBounds(week){
      for(let i = 0; i < weekBounds.length; i++){
        if (weekBounds[i].week == week){
          return weekBounds[i];
        }
      }
      return null;
    }

    function tryInitialiseCanvas(){
      if (!hasDrawnToCanvasForFirstTime){
        canvas = document.getElementById("canvas");
         if (canvas != null){
            redrawCanvasAccordingToWeek(week);
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
        hasDrawnToCanvasForFirstTime = true;
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

    let currentWeekBounds = getCurrentWeekBounds(week);
    tryInitialiseCanvas();

    return (
    <>
        <h1 style={window.innerWidth < 1000 ? {width:"100%",backgroundColor:"white", border:"2px solid rgb(220,220,220)"}: {}}>
            {window.innerWidth > 1000 ? "Territory Map History" : "I recommend you use this on PC instead"}
        </h1>
        <h1 style={{marginTop: "2em", position:"absolute", top:"35%", textAlign:"center", width:"100%", display:"inherit", zIndex:"0"}}>
            {isReady ? null : (window.innerWidth < 1000 ? "LOADING..." : "LOADING...")}
        </h1>
        <div id="displayParent" style={{fontSize:windowFontSize}}>
          <div id="display" style={{position:'absolute',left:"calc("+mapAdjustLeft+" + "+displayLeft+"px)",
              top:"calc("+mapAdjustTop+" + "+displayTop+"px)",fontSize:fontSizeEm+"em"}}>
              <div id="territories" style={{position:'absolute', left:mapAdjustLeft, top:mapAdjustTop}}>
                {territories.map((t) => t.week == week ? (<><Territory fadedOut={highlightedCategory == null ? false : (highlightedCategory != t.alignment)} t={t} name={t.name} alignment={t.alignment} holder={t.holder} emPosX={t.emPosX} emPosY={t.emPosY} week={t.week} territoryLabelFontSize={territoryLabelFontSize}/></>) : null)}
              </div>
              <>{SHOW_DEBUG_COORDS_IN_CENTRE ? displayLeft + " " + displayTop : null}</>
              {
                currentWeekBounds != null
                ?
                <canvas id="canvas" width="1920" height="1080" style={{position:'absolute', left:currentWeekBounds.minX+"em",
                                           top:currentWeekBounds.minY+"em",                         
                                           width:(currentWeekBounds.maxX - currentWeekBounds.minX)+"em",
                                           height:(currentWeekBounds.maxY - currentWeekBounds.minY)+"em"}}></canvas>
                : null                
              }
          </div>
        </div>
        <p className="hideOnMobile" style={{color:"rgb(180,180,180)", margin: "2em 0 2em 6em", width: "100%", bottom:0, position:"absolute"}}>
          Disclaimer: This is unofficial, and for comparing changes from past weeks - it's definitely not live!
        </p>
        <div id="panel" onMouseEnter={() => {mouseIsOverPanel = true;}} onMouseLeave={() => {mouseIsOverPanel = false;}}>
            <br/>
            <br/>
            <h2>Legend</h2>
            <hr/>
            <div id="key" style={{overflow:'auto', width:"fit-content"}}>
              <div onMouseLeave={() => {setHighlightedCategory(null)}}>
                <div>
                  <LegendElement alignment="Ventrue" setHighlightedCategory={setHighlightedCategory}/>
                  <LegendElement alignment="Daeva" setHighlightedCategory={setHighlightedCategory}/>
                  <LegendElement alignment="Mekhet" setHighlightedCategory={setHighlightedCategory}/>
                  <LegendElement alignment="Gangrel" setHighlightedCategory={setHighlightedCategory}/>
                  <LegendElement alignment="Nos" setHighlightedCategory={setHighlightedCategory}/>
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
            <br/>
            <h2>Select past week</h2>
            <hr/>
            <div className="weeksScroll">
              <>{loadedWeeks.map((wk) => <><h4 className={"weekOption"+ (wk.weekNumber == week ? " selected" : "")} onClick={() => week != wk.weekNumber ? changeWeek(wk.weekNumber) : null}>{wk.title}</h4></>)}</>
            </div>
        </div>
    </>
  )
}

export default App