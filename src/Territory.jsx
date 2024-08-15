import { useState } from 'react'
import './index.css'

function Territory (props) {

    let _holder = props.t.holder;

    if (_holder == "Praxis"){
        _holder = null;
    }

    let splitHolder = ("("+_holder+")").replaceAll("  "," ").split(" ");
    
    let holderSegments = [];
    let curSegment = "";
    let holderFull = null;

    if (props.t.maxHolderLineLength > 0){       //breaks up the holder name onto separate lines
        for (let i = 0; i < splitHolder.length; i++){      
            if (curSegment.length + splitHolder[i].length <= props.t.maxHolderLineLength){
                curSegment += splitHolder[i] + " ";
                if (i == splitHolder.length - 1){
                    holderSegments.push(<>{curSegment+""}</>);
                }
            }
            else {
                if (curSegment != ""){
                    holderSegments.push(<>{curSegment+""}</>);
                    holderSegments.push(<br/>);
                }
                curSegment = splitHolder[i] + " "; //this is the segment that we decided wouldn't fit on the end of this line, so it instead forms the basis for the next line.""
                if (i == splitHolder.length - 1){
                    holderSegments.push(<>{curSegment+""}</>);
                }
            }
        }
        holderFull = <>{holderSegments.map((s) => s)}</>
    } else {
        holderFull = <>{"("+_holder+")"}</>
    }

    let [id] = useState(props.t.territoryName.toLowerCase().replaceAll(" ","-"));
    let [mouseOver, setMouseOver] = useState(false);    

    return (
    <>
     <div title={props.t.useFlipside ? "You flipped this territory!" : null} className={"territory "+ (props.t.useFlipside && props.t.flipside != null ? props.t.flipside : props.t.alignment) + (props.t.useFlipside ? " flipside": "")} id={id} onMouseEnter={() => {setMouseOver(true)}} onMouseLeave={() => {setMouseOver(false)}}
     style={{zIndex: (mouseOver ? 2 : 1), opacity:props.fadedOut ? 0.025 : 1}}>
        <div className="territoryText" style={{whiteSpace:"nowrap"}}>
            {props.t.territoryName}
        </div>
        {_holder != null ? 
            <div className="territoryText">
                {holderFull}
            </div> : null}
    </div>
    </>
  )
}

export default Territory