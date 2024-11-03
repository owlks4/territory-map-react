import { useState, createRef } from "react";
import {isClan, isCovenant} from "./App.jsx";

class Achievement {
    constructor(magnitude, text){
        this.magnitude = magnitude;
        this.text = text;
        //maybe also a 'decoration'? Which specifies some boilerplate parameters allowing you to (e.g.) show some fake territories of the proper alignment and name in a nice display
    }
}

let stats = null;

function setWrappedStats(_stats){
    stats = _stats;
}

function getStatsDatasetWithLabel(label){
    for (let i = 0; i < stats.datasets.length; i++){
        let potential = stats.datasets[i];
        if (potential.label == label){
            return potential;
        }
    }
    console.log("Couldn't find dataset with label: "+label);
    return null;
}

// easy ideas for achievements:
// * ended the current run as the clan with the most territory
// * ended the current run as the covenant with the most territory
// * ended the current run as the overall group with the most territory

// * was, at some point, the clan with the most territory
// * was, at some point, the covenant with the most territory
// * was, at some point, the overall group with the most territory

// * was the clan with the highest rate of territory acquisition at some point
// * was the covenant with the highest rate of territory acquisition at some point
// * was the overall group with the highest rate of territory acquisition at some point
// * if you weren't any of them, just display the week where your particular group had its personal best of territory acquisition

// * won a territory battle at some point
// * engaged in a territory battle at some point (and valiantly lost)

// * clan flipped a territory and caused a change in precedence
// * covenant flipped a territory and caused a change in precedence

// * also generic stats that aren't there because they're groundbreaking, but there because they're interesting. Stuff like 'at its peak, your clan and covenant combined held X% of the territory in elysium'

// * A joke filler stat if we really don't have anything else: "Overall, the domain was extremely unstable. That's in the top 1% of unstable domains worldwide!"

let fallback = [
    new Achievement(2,"Overall, the domain was extremely unstable. That's in the top 1% of unstable domains worldwide!"),
    new Achievement(3,"The starter prince was overthrown, and a new one instated... surely, this will solve all our problems..."),
];

const TOTAL_NUMBER_OF_TERRITORIES_ON_MAP = 34;

function wasOnceTheFactionOfTypeWithTheMostTerritory(clan, cov, which){

    let factionsWithTheMostTerritory = null;
    let mostTerritory = 0;

    for (let i = 0; i < stats.datasets[0].data.length; i++){
        stats.datasets.forEach(faction => {
            if (faction.label == "enemy" || faction.label == "unclaimed"){
                return;
            }
            if ((which == "clan" && isClan(faction.label)) || (which == "covenant" && isCovenant(faction.label)) || which == "any"){
                if (faction.data[i] > mostTerritory){
                    factionsWithTheMostTerritory = [faction.label];
                    mostTerritory = faction.data[i];
                } else if (mostTerritory != 0 && faction.data[i] == mostTerritory){
                    if (!factionsWithTheMostTerritory.includes(faction.label)){
                        factionsWithTheMostTerritory.push(faction.label);
                    }                 
                }
            }
        });
    }

    console.log("Factions with the most territory at any one time:");
    console.log(factionsWithTheMostTerritory);

    switch (which){
        case "clan":
            {
            let succeeded = factionsWithTheMostTerritory.includes(clan);
            return [succeeded, succeeded ? mostTerritory : null];
            }            
        case "covenant":
            {
            let succeeded = factionsWithTheMostTerritory.includes(cov);
            return [succeeded, succeeded ? mostTerritory : null];
            }    
        default:
            {
            let succeeded = factionsWithTheMostTerritory.includes(clan) || factionsWithTheMostTerritory.includes(cov);
            return [succeeded, succeeded ? mostTerritory : null];
            }    
    }
}

function getPeakCombinedOwnershipAchievement(clan,cov){
    let numberOfTerritoriesAtPeak = 0;
    let weekOfOccurrence = null;

    let clanData = getStatsDatasetWithLabel(clan);
    let covData = getStatsDatasetWithLabel(cov);

    for (let i = 0; i < stats.datasets[0].data.length; i++){
        let combined = clanData.data[i] + (covData == null ? 0 : covData.data[i]);
        if (combined > numberOfTerritoriesAtPeak){
            numberOfTerritoriesAtPeak = combined;
            weekOfOccurrence = [i + 1]
        } else if (numberOfTerritoriesAtPeak != 0 && combined == numberOfTerritoriesAtPeak){
            weekOfOccurrence.push[i + 1]
        }
    }

    console.log("Peak combined ownership of "+clan+" and "+cov+" was "+numberOfTerritoriesAtPeak+" in " + "week "+weekOfOccurrence[0])

    if (numberOfTerritoriesAtPeak == null || weekOfOccurrence == null){
        alert("WTF. You need to define more empirical data for the combined clan/cov peak ownership stats.");
    }
    return new Achievement(1,"The highest number of territories held by your clan and covenant combined was "+numberOfTerritoriesAtPeak+", in week "+weekOfOccurrence+".\n\nThat's "+String(numberOfTerritoriesAtPeak/TOTAL_NUMBER_OF_TERRITORIES_ON_MAP*100).slice(0,4)+"% of all territory!\n");
}

function getAchievementsForClanAndCov(clan,cov){
    let myAchievements = [];

    myAchievements.push(getPeakCombinedOwnershipAchievement(clan,cov));

    let anyFactionPeakOwnership = wasOnceTheFactionOfTypeWithTheMostTerritory(clan,cov,"any");
    if (anyFactionPeakOwnership[0]){
         myAchievements.push(new Achievement(5, "At one point, one of your factions had the most overall territory, with "+anyFactionPeakOwnership[1]+" territories!"))
    } else {
        let clanFactionPeakOwnership = wasOnceTheFactionOfTypeWithTheMostTerritory(clan,cov,"clan");
        if (clanFactionPeakOwnership[0]){
           myAchievements.push(new Achievement(5, "At one point, your clan had the most overall territory, with "+clanFactionPeakOwnership[1]+" territories!"))
        }
        let covenantFactionPeakOwnership = wasOnceTheFactionOfTypeWithTheMostTerritory(clan,cov,"covenant");
        if (covenantFactionPeakOwnership[0]){
            myAchievements.push(new Achievement(5, "At one point, your covenant had the most overall territory, with "+covenantFactionPeakOwnership[1]+" territories!"))
        }
    }

    let i_in_fallback = 0;
    while (myAchievements.length < 6){
        myAchievements.push(fallback[i_in_fallback]);
        i_in_fallback++;
    }

    myAchievements.sort((a,b)=>{return a.magnitude == b.magnitude ? 0 : (a.magnitude < b.magnitude ? -1 : 1)});

    myAchievements = myAchievements.filter((achievement) => achievement != null);

    myAchievements.forEach((achievement, index) => {
        achievement.achievementIndex = index;
    });

    return myAchievements;
}

let indexOfCurrentlyViewedAchievement = -1;

function Wrapped (props){

    let [achievements,setAchievements] = useState([]);

    function startWrapped(clan,cov){
        setAchievements(getAchievementsForClanAndCov(clan,cov));
        scrollToNextAchievement();
    }

    function scrollToNextAchievement(){
        if (indexOfCurrentlyViewedAchievement > -1){
            document.getElementById("achievement-"+indexOfCurrentlyViewedAchievement).className = "achievement achievement-leaves";
        }        
        indexOfCurrentlyViewedAchievement++;
        document.getElementById("achievement-"+indexOfCurrentlyViewedAchievement).className = "achievement achievement-arrives";
    }

    function AchievementComponent(props){
        return (
            <div className={props.data.achievementIndex == 0 ? "achievement achievement-arrives" : "achievement achievement-antenatal"}
                id={"achievement-"+props.data.achievementIndex}>
                <h1>
                {props.data.text}
                </h1>
                <button type="button" className="wrapped-start-button" onClick={() => {scrollToNextAchievement();}}>Next</button>
            </div> 
        );
    }

    let isMobile = window.innerWidth < window.innerHeight;
    
    let clanSelectorRef = createRef();
    let covSelectorRef = createRef();

    let clanSelector =
    <select ref={clanSelectorRef} id="clan-selector" className="big-select">
        <option id="wrapped-ventrue" value="ventrue">
            Ventrue
        </option>
        <option id="wrapped-daeva" value="daeva">
            Daeva
        </option>
        <option id="wrapped-mekhet" value="mekhet">
            Mekhet
        </option>
        <option id="wrapped-gangrel" value="gangrel">
            Gangrel
        </option>
        <option id="wrapped-nos" value="nosferatu">
            Nosferatu
        </option>
    </select>;           

    let covSelector =
    <select ref={covSelectorRef} id="cov-selector" className="big-select">
        <option id="wrapped-invictus" value="invictus">
            Invictus
        </option>
        <option id="wrapped-carthian" value="carthian">
            Carthian
        </option>
        <option id="wrapped-crone" value="crone">
            Crone
        </option>
        <option id="wrapped-lance" value="lance">
            Lance
        </option>
        <option id="wrapped-ordo" value="ordo">
            Ordo
        </option>
        <option id="wrapped-unaligned" value="unaligned">
            Unaligned
        </option>
    </select>;

    let [wrappedActivated, setWrappedActivated] = useState(false)

    return (
        wrappedActivated ?
            <div className="wrapped-fullscreen" style={{padding:isMobile?"10vw":"0"}}>
                <audio autoPlay={true} src="/snow.mp3" loop={true}></audio>
                <div className={indexOfCurrentlyViewedAchievement == -1 ? "" : "achievement-leaves"}>
                    <div style={{fontSize:isMobile?"3em":"5em"}}>
                        Territory Map
                        <div className="fancy-font" style={{fontSize:isMobile?"1.25em":"1.5em"}}>
                            Wrapped
                        </div>
                    </div>
                    <div style={{fontSize:"1.5em", textAlign:"left", display:"flex", flexDirection:"row", justifyContent:"space-evenly"}}>
                        <div>
                            Your clan
                            <br/>
                            {clanSelector}
                        </div>
                        <div>
                            Your Covenant
                            <br/>
                            {covSelector}
                        </div>
                    </div>
                    <br/>
                    <div style={{textAlign:"center"}}>
                        <button type="button" className="wrapped-start-button" onClick={() => {startWrapped(clanSelectorRef.current.value, covSelectorRef.current.value);}}>Start</button>
                    </div>
                </div>
                <div>
                    {
                    achievements.length > 0
                    ?
                    achievements.map(item => <AchievementComponent data={item}/>)
                    :
                    <></>
                    }
                </div>
            </div>
        :
        <div className="wrapped-ribbon" onClick={()=>{setWrappedActivated(true); document.getElementById('root').style = ""; document.getElementById("root").scrollTop = 0; document.title = "Territory Map Wrapped"}}>Click here for Territory Map Wrapped!</div>
    );
}

export default Wrapped

export {setWrappedStats}