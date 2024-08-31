function WeekTitle(props){

    return (
    <div style={{display:"flex",justifyContent:"left",alignItems:"start"}}>
        <div style={{whiteSpace:"nowrap",whiteSpaceCollapse:"preserve"}}>
            {"Week "+props.number+" - "}
        </div>
        <div style={{boxSizing:"border-box", paddingRight:"0.5em"}}>
            {props.title}
        </div>
    </div>
    );
}

export default WeekTitle