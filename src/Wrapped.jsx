function Wrapped (props){

    let isMobile = window.innerWidth < window.innerHeight;

    return (
    <div className="wrapped-fullscreen" style={{padding:isMobile?"10vw":"0"}}>
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
                    <select className="big-select">
                        <option id="wrapped-ventrue">
                            Ventrue
                        </option>
                        <option id="wrapped-daeva">
                            Daeva
                        </option>
                        <option id="wrapped-mekhet">
                            Mekhet
                        </option>
                        <option id="wrapped-gangrel">
                            Gangrel
                        </option>
                        <option id="wrapped-nos">
                            Nosferatu
                        </option>
                    </select>
                </div>
                <div>
                    Your Covenant
                    <br/>
                    <select className="big-select">
                        <option id="wrapped-invictus">
                            Invictus
                        </option>
                        <option id="wrapped-carthian">
                            Carthian
                        </option>
                        <option id="wrapped-crone">
                            Crone
                        </option>
                        <option id="wrapped-lance">
                            Lance
                        </option>
                        <option id="wrapped-ordo">
                            Ordo
                        </option>
                        <option id="wrapped-unaligned">
                            Unaligned
                        </option>
                    </select>
                </div>
            </div>
            <br/>
            <div style={{textAlign:"center"}}>
                <button type="button" className="wrapped-start-button">Start</button>
            </div>
        </div>
    </div>
    );
}

export default Wrapped
