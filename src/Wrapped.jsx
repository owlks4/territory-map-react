import { useEffect, createRef } from "react";

class Achievement {
    constructor(magnitude, text){
        this.magnitude = magnitude;
        this.text = text;
        //maybe also a 'decoration'? Which specifies some boilerplate parameters allowing you to (e.g.) show some fake territories of the proper alignment and name in a nice display
    }
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

// * won a territory battle at some point
// * engaged in a territory battle at some point (and valiantly lost)

// * clan flipped a territory and caused a change in precedence
// * covenant flipped a territory and caused a change in precedence

// * also generic stats that aren't there because they're groundbreaking, but there because they're interesting. Stuff like 'at its peak, your clan and covenant combined held X% of the territory in elysium'

// * A joke filler stat if we really don't have anything else: "Overall, the domain was extremely unstable. That's in the top 1% of unstable domains worldwide!"

let fallback = [
    new Achievement(2,"Overall, the domain was extremely unstable. That's in the top 1% of unstable domains worldwide!"),
    new Achievement(3,"The starter prince was overthrown, and a new one instated... surely, this will solve all our problems..."),
    new Achievement(4,"But importantly, the territory map has NOTHING on all the bargains, conversations, and power plays going on in the thick of Elysium. Go team!")
];

const TOTAL_NUMBER_OF_TERRITORIES_ON_MAP = 34;

function getPeakCombinedOwnershipAchievement(clan,cov){
    let combined = clan+"-"+cov;
    let numberOfTerritoriesAtPeak = null;
    let weekOfOccurrence = null;
    let desc = null;

    switch (combined){
        case "ventrue-invictus":
        break;
        case "ventrue-carthian":
        break;
        case "ventrue-lance":
        break;
        case "ventrue-crone":
        break;
        case "ventrue-ordo":
        break;
        case "daeva-invictus":
        break;
        case "daeva-carthian":
        break;
        case "daeva-lance":
        break;
        case "daeva-crone":
        break;
        case "daeva-ordo":
        break;
        case "mekhet-invictus":
        break;
        case "mekhet-carthian":
        break;
        case "mekhet-lance":
        break;
        case "mekhet-crone":
        break;
        case "mekhet-ordo":
        break;
        case "gangrel-invictus":
            
        break;
        case "gangrel-carthian":
            desc = "Soon it won't be only you whose shape shifts and changes by the hour - the very domain itself will live anew when the revolution comes."
        break;
        case "gangrel-lance":
            desc = "A window back into the human world, where your protean efforts are placed fully behind the mission to set Kine back on the right path."
        break;
        case "gangrel-crone":
            desc = "Feeding grounds... and useful for the odd ritual."
        break;
        case "gangrel-ordo":
            desc = "A coming together of the wild and the urban, the past and the present, helping you seek out the great work."
        break;
        case "nosferatu-invictus":
            desc = "A demonstration of the fact that the haunts are just as deserving of respect as anyone else - it's earning your position that counts."
        break;
        case "nosferatu-carthian":
            desc = "A physical chain of land that embodies your revolutionary efforts to create a better world."
        break;
        case "nosferatu-lance":
            desc = "These territories are your inroads back into the kine world, where the fear you strike as a member of the haunts is always for the greater good."
        break;
        case "nosferatu-crone":
             desc = "An intricate network of places of power that surely draw from that wellspring of dark energy - the necropolis."
        break;
        case "nosferatu-ordo":
            desc = "A veritable kingdom of spooky secrets - how remarkable."
        break;
        default:
            alert("That combination ("+combined+") didn't exist.")
        break;
    }
    if (numberOfTerritoriesAtPeak == null || weekOfOccurrence == null || desc == null){
        alert("WTF. You need to define more empirical data for the combined clan/cov peak ownership stats.");
    }
    return new Achievement(2,"The highest number of territories held by your clan and covenant at any one time was "+numberOfTerritoriesAtPeak+" in week "+weekOfOccurrence+".\n\nThat's "+(numberOfTerritoriesAtPeak/TOTAL_NUMBER_OF_TERRITORIES_ON_MAP*100)+"% of all territory!\n"+desc);
}

let achievementsByGroup = { //achievements have magnitude values so that the user's complete list (as combined from their different alliegances) can be put together in order of magnitude and build up to the end
    "ventrue":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!"),
        new Achievement(2,"And here's your second achievement... with a nice statistic too!"),
        new Achievement(4,"But you *really* cooked with this one! (winning a fight etc)")
    ],
    "daeva":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!")
    ],
    "mekhet":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!")
    ],
    "gangrel":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!")
    ],
    "nosferatu":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!")
    ],
    "invictus":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!")
    ],
    "carthian":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!")
    ],
    "crone":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!")
    ],
    "lance":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!")
    ],
    "ordo":
    [
        new Achievement(1,"You did X, Y, and Z. Wow!")
    ],
    "unaligned":
    [
        new Achievement(-1,"A free spirit! A lone ranger! Well, obviously unaligned isn't a group that holds territory per se, so let's look at personal-aligned territories instead!")
    ]
}

function getAchievementsForClanAndCov(clan,cov){
    let myAchievements = [];

    achievementsByGroup[clan].forEach(achievement => {myAchievements.push(achievement)});
    achievementsByGroup[cov].forEach(achievement => {myAchievements.push(achievement)});

    if (cov != "unaligned"){
        myAchievements.push(getPeakCombinedOwnershipAchievement(clan,cov))
    }    

    let i_in_fallback = 0;
    while (myAchievements.length < 6){
        myAchievements.push(fallback[i_in_fallback]);
        i_in_fallback++;
    }

    myAchievements.sort((a,b)=>{return a.magnitude == b.magnitude ? 0 : (a.magnitude < b.magnitude ? -1 : 1)});

    return myAchievements;
}

function Wrapped (props){

    let isMobile = window.innerWidth < window.innerHeight;
    
    let clanSelectorRef = createRef();
    let covSelectorRef = createRef();

    console.log(clanSelectorRef);

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

    return (
    <div className="wrapped-fullscreen" style={{padding:isMobile?"10vw":"0"}}>
        <audio autoPlay={true} src="/snow.mp3" loop={true}></audio>
        <div>
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
                <button type="button" className="wrapped-start-button" onClick={() => {console.log(getAchievementsForClanAndCov(clanSelectorRef.current.value, covSelectorRef.current.value))}}>Start</button>
            </div>
        </div>
    </div>
    );
}

export default Wrapped