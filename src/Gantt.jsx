import './index.css'
import detitle from './detitle';

function getTerritoryByName(territoryChanges, requiredTerritoryName){
    for (let i = 0; i < territoryChanges.length; i++){
        let t = territoryChanges[i];
        if (t.territoryName == requiredTerritoryName){
            return t;
        }
    }
    return null;
}

function doTenureAnalysis(weeks, t, property){
    let curTenure = {
        numWeeks: 0,
    };  

    let tenures = []

    let territoryState = null;

    for (let i = 0; i < weeks.length; i++){
        territoryState = getTerritoryByName(weeks[i].territoryChanges, t.territoryName);

        if (territoryState != null){
            if (curTenure.value != null){ //if it's actually valid to conclude a tenure right now (as we might be before the initial acquisition of a value)
                if ((territoryState[property] != curTenure.value) && !(property == "holder" && detitle(territoryState[property]) == curTenure.value)){ //then there's been a change in ownership, so push the current tenure                    
                    tenures.push(curTenure);
                    curTenure = { //and a new tenure begins
                        numWeeks: 0
                    }
                }
            }
            curTenure.value = territoryState[property]; //this is here so that the first week picks up the correct value            
            if (property == "holder"){
                curTenure.alt = curTenure.value;
                console.log(detitle(curTenure.value))
                curTenure.value = detitle(curTenure.value)
            }
        }
        curTenure.numWeeks = curTenure.numWeeks + 1;
        if (i == weeks.length - 1){
            tenures.push(curTenure);
        }
    }

    tenures.forEach((tenure)=>{
        if (tenure.alt != null){
            tenure.value = tenure.alt;
        }
    })

    return tenures;
}

function getWeekSuffixStr(num){
    return num == 1 ? " week" : " weeks"; //space at beginning is [sic]
}

function Gantt(props) {

    let alignmentTenures = doTenureAnalysis(props.weeks, props.t, props.t.useFlipside ? "flipside" : "alignment");
    let holderTenures = doTenureAnalysis(props.weeks, props.t, "holder");

    let legend = 
    (<div>
        <div style = {{display:'flex', justifyContent:"space-between"}}>
        {
            props.weeks.map((wk) =>  <>{
                <span style={{width:((1/props.weeks.length) * 100) + "%",textAlign:"center"}}>
                    {(props.weeks.indexOf(wk)) % 2 == 0 || props.weeks.length < 6 ? props.weeks.indexOf(wk)+1 : null}
                </span>
            } </>)
        }
        </div>
        <div style={{width:"100%",textAlign:'center',fontSize:"0.9em",marginTop:"2px"}}>Week</div>
    </div>    
    );

    return (
    <>
    <h4 style={{whiteSpace:"nowrap"}}><strong>{"Alignment history of "}<span style={{display:"inline-block",transform: props.t.useFlipside ? "rotate(180deg)":"inherit"}}>{props.t.territoryName}</span></strong> <span href="#" className={props.t.useFlipside ? "flip-button on" : "flip-button"} title="Flip territory" onClick={()=>{props.t.useFlipside = !props.t.useFlipside; props.refreshFunc()}}>🔄</span></h4>
    <h5>Alignment</h5>
     <div style={{display:'flex', border:"1px solid black", width:"290px", height:"1.5em"}}>
        {
            alignmentTenures.map((tenure) => <>{
                <div title={tenure.value +", "+tenure.numWeeks+getWeekSuffixStr(tenure.numWeeks)} className={tenure.value} style={{boxSizing:"border-box", cursor:"pointer", width:((tenure.numWeeks/props.weeks.length)*100)+"%"}}>
                </div>
            }</>)
        }
     </div>
     {legend}
     <h5>Holder</h5>
     <div className="gantt-area">
        {
            holderTenures.map((tenure) => <>{
                <div title={tenure.value +", "+tenure.numWeeks+getWeekSuffixStr(tenure.numWeeks)} style={{boxSizing:"border-box", backgroundColor:holderTenures.indexOf(tenure) % 2 == 0 ? "#efefef" : "#afafaf",
                cursor:"pointer", width:((tenure.numWeeks/props.weeks.length)*100)+"%"}}>
                </div>
            }</>)
        }
     </div>
     {legend}
    </>
  )
}

export default Gantt