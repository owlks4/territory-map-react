import './index.css'

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
            if (curTenure[property] != null){ //if it's actually valid to conclude a tenure right now (as we might be before the initial acquisition of a value)
                if ((territoryState[property] != curTenure[property])){ //then there's been a change in ownership, so push the current tenure
                    tenures.push(curTenure);
                    curTenure = { //and a new tenure begins
                        numWeeks: 0
                    }
                }
            }
            curTenure[property] = territoryState[property]; //this is here so that the first week picks up the correct value
        }
        curTenure.numWeeks = curTenure.numWeeks + 1;
        if (i == weeks.length - 1){
            tenures.push(curTenure);
        }
    }

    return tenures;
}

function Gantt(props) {

    let alignmentTenures = doTenureAnalysis(props.weeks, props.t, "alignment");
    let holderTenures = doTenureAnalysis(props.weeks, props.t, "holder");

    let legend = 
    (<div>
        <div style = {{display:'flex', justifyContent:"space-between"}}>
        {
            props.weeks.map((wk) =>  <>{
                <span style={{width:((1/props.weeks.length) * 100) + "%",textAlign:"center"}}>
                    {(props.weeks.indexOf(wk)) % 2 == 0 ? props.weeks.indexOf(wk)+1 : null}
                </span>
            } </>)
        }
        </div>
        <div style={{width:"100%",textAlign:'center',fontSize:"0.9em",marginTop:"2px"}}>Week</div>
    </div>    
    );

    return (
    <>
    <h4><strong>{"Alignment history of "+props.t.territoryName}</strong></h4>
    <h5>Alignment</h5>
     <div style={{display:'flex', border:"1px solid black", width:"290px", height:"1.5em"}}>
        {
            alignmentTenures.map((tenure) => <>{
                <div title={tenure.alignment +", "+tenure.numWeeks+" weeks"} className={tenure.alignment} style={{boxSizing:"border-box", cursor:"pointer", width:((tenure.numWeeks/props.weeks.length)*100)+"%"}}>
                </div>
            }</>)
        }
     </div>
     {legend}
     <h5>Holder</h5>
     <div className="gantt-area">
        {
            holderTenures.map((tenure) => <>{
                <div title={tenure.holder +", "+tenure.numWeeks+" weeks"} style={{boxSizing:"border-box", backgroundColor:holderTenures.indexOf(tenure) % 2 == 0 ? "#efefef" : "#afafaf",
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