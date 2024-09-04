import './index.css'

function LegendElement (props) {

return (<div className={"territory "+props.alignment.toLowerCase()+" inline-territory"}
         onClick={props.onClick} title={window.innerWidth > 1000 ? "Click to view as a graph" : null}
         onMouseEnter={() => {props.setHighlightedCategory(props.alignment.toLowerCase())}}>
            {props.alignment == "Nosferatu" ? "Nos" : props.alignment}  
        </div>);
}

export default LegendElement