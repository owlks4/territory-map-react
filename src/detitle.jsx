let titleModifiers = ["Alder","Aldur","Aldar","ALDER"]
let titleComponents = ["Mister","Madame","Madam","Mr","Mme","Mastress","Ind","Mx","Msr","Myr","Misc","Mystery","Mre","LORD","Lord","Lady","Laird","Lux","Luxor","Lx","Baron","Baroness","Sir","Dame","Viscount","Earl","Marquis","Duke","Duchess","Layde","Liege","Barone","Baroen","Baronx","Ber","Ser","Dux"]

function detitle(s){
    s = s.replace(".","")

    for (let i = 0; i < titleModifiers.length; i++){
        let lookForThis = titleModifiers[i]+" ";
        if (s.indexOf(lookForThis) == 0){
            s = s.replace(lookForThis,"");
        }
    }

    for (let i = 0; i < titleComponents.length; i++){
        let lookForThis = titleComponents[i]+" ";
        if (s.indexOf(lookForThis) == 0){
            s = s.replace(lookForThis,"");
            break;
        }
    }

    return s.trim();
}

export default detitle