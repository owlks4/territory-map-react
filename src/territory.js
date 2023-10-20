

class Territory {
    constructor(name,alignment,holder,emPosX,emPosY){
        this.name = name;
        this.alignment = alignment;

        if (this.alignment == "nos"){
            this.alignment = "nosferatu";
        } else if (this.alignment == "carthians"){
            this.alignment = "carthian";
        } else if (this.alignment == "circle"){
            this.alignment = "crone";
        } else if (this.alignment == "ordo dracul"){
            this.alignment = "ordo";
        } else if (this.alignment == "lancea"){
            this.alignment = "lance";
        }

        this.holder = holder;
        if (this.holder == "NONE"){
            this.holder = null;
        }

        this.emPosX = emPosX;
        this.emPosY = emPosY;
    }
}

class Adjacency {
    constructor(x1,y1,x2,y2,a1){
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.a1 = a1;
    }
}

function getTerritoriesFromCSV(){
    fetch("./csv/y"+year+"/territoryAssignments-wk"+week+".csv")
    .then(response => response.text())
    .then(text => {
    let lines = text.split("\n");

    weekTitle = lines[0];
    territoryLabelFontSize = lines[1].trim();
    console.log("Week "+week+": "+weekTitle);

    for (let i = 3; i < lines.length; i++){
        let splitLine = lines[i].split(",");
        if (splitLine[0].trim() == "ADJACENCY"){
            adjacencies.push(
                new Adjacency(
                    splitLine[1].trim(),
                    splitLine[2].trim(),
                    splitLine[3].trim(),
                    splitLine[4].trim(),
                    splitLine[5].trim()));
        } else {
            territories.push(
                new Territory(
                    splitLine[0].trim(),
                    splitLine[1].trim().toLowerCase(),
                    splitLine[2].trim(),
                    splitLine[3].trim(),
                    splitLine[4].trim()));
        }
    }
    spawnTerritoriesAndAdjacencies();
  });
}

function getTerritory(name){
    for (let i = 0; i < territories.length; i++){
        let t = territories[i];
        if (t.name == name){
            return t;
        }
    }
    console.log("COULDN'T FIND TERRITORY: "+name);
}

function onMouseMove(event) {
    if (dragging){
        displayLeft += event.movementX;
        displayTop += event.movementY;
        updateDisplay();
        updateCanvasPosition();
    }
}

function onTouchMove(event) {
    if (dragging){
        let touch = event.touches[0];
        displayLeft += touch.clientX - touchStartX;
        displayTop += touch.clientY - touchStartY;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        updateDisplay();
        updateCanvasPosition();
    }
}

function updateDisplay(){
    display.style = "position:absolute; left:calc("+mapAdjustLeft+" + "+displayLeft+"px); top:calc("+mapAdjustTop+" + "+displayTop+"px);font-size:"+fontSizeEm+"em;";
}

function spawnTerritoriesAndAdjacencies(){
    updateDisplay();
    territoriesDOMElement.textContent = "";
    territoriesDOMElement.style="position:absolute;left:"+mapAdjustLeft+";top:"+mapAdjustTop;
    document.body.onmousedown = () => {dragging = true;};

    for (let i = 0; i < territories.length; i++){
        let t = territories[i];
        let newElement = document.createElement("div");
        newElement.className = "territory "+t.alignment;
        newElement.id = t.name.toLowerCase().replaceAll(" ","-");
        newElement.style = "left: calc(50% + "+t.emPosX+"em); top: calc(50% + "+t.emPosY+"em);";

        let text = document.createElement("div");
        text.textContent = t.name;
        text.className = "territoryText";
        text.style = "white-space: nowrap; font-size:"+territoryLabelFontSize;
        newElement.appendChild(text);

        if (t.holder != null){
            let holder = document.createElement("div");
            holder.style = "font-size:"+territoryLabelFontSize;
            holder.textContent = "("+t.holder+")";
            holder.className = "territoryText";
            newElement.appendChild(holder);
        }

        territoriesDOMElement.appendChild(newElement);
    }

    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < adjacencies.length; i++){
        let a = adjacencies[i];
        ctx.beginPath();
        ctx.moveTo(a.x1,a.y1);
        ctx.arcTo(a.x1, a.y2, a.x2, a.y2, a.a1);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    updateCanvasPosition();
}

function updateCanvasPosition(){
    canvas.style = "left:calc("+mapAdjustLeft+" + "+displayLeft+"px);top:calc("+mapAdjustTop+" + "+displayTop+"px); width:"+(fontSizeEm*100)+"%; height:"+(fontSizeEm*100)+"%;margin:"+(-20 * fontSizeEm)+"% 0 0 "+(-50 * fontSizeEm)+"%;";
}

document.addEventListener("mousemove", onMouseMove);
document.addEventListener("mouseup", () => {dragging = false;});
addEventListener("wheel", (ev) => {let change = ev.deltaY/1000; (fontSizeEm - change > 0.5) && (fontSizeEm - change < 3) ? fontSizeEm -= change : null; updateDisplay(); updateCanvasPosition()});
document.addEventListener("touchmove", onTouchMove);
document.addEventListener("touchstart", ev => {dragging = true; let touch = ev.touches[0]; touchStartX = touch.clientX; touchStartY = touch.clientY;});
document.addEventListener("touchend",() => {dragging = false;});
getTerritoriesFromCSV();