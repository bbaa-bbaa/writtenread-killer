const pinyin = require("./assets/pinyin.json");;
const rpinyin = {};
const frequence = require("./assets/frequence.json");
let text = [];
let result = [];
let index = 0;
let usedhans = 0.3;
let reverse = false;
for (const [k, v] of Object.entries(pinyin)) {
    if (/,/.test(v)) {
        let py=v.split(",")[0]
        if (!(py in rpinyin)) {
            rpinyin[py] = []
        }
        rpinyin[py].push(k)
    } else {
        if (!(v in rpinyin)) {
            rpinyin[v] = []
        }
        rpinyin[v].push(k);
    }
}
function getPinyin(index) {
    if (text[index].length == 2) {
        return text[index][1];
    } else {
        return pinyin[text[index]];
    }
}
function transformOnce() {
    let py = null;
    try {
        py = getPinyin(index);
        if(!py) throw Error("没有拼音")
    } catch (e) {
        return text[index][0];
    }
    if (/,/.test(py)) {
        postMessage({ method: "choicePinyin", list: py.split(",") ,index});
        return "ChoicePinYin";
    } else {
        let samepy = rpinyin[py];
        let samepya = samepy.map(d => {
            let index = frequence.indexOf(d);
            return index == -1 ? [-Infinity, d] : [index, d];
        }).sort((a, b) => reverse ? (b[0] - a[0]) : (a[0] - b[0]));
        return samepya[Math.floor(Math.random() * samepya.length * usedhans)][1];
    }
}
function transform(){
    while(index<text.length){
        let r=transformOnce();
        if(r==="ChoicePinYin"){
            break;
        }
        result.push(r);
        index++;
    }
    return result.join('');
}
addEventListener("message", (e) => {
    switch (e.data.method) {
        case "transform":
            text = [];
            result = [];
            index = 0;
            text = e.data.text;
            usedhans = e.data.usedhans;
            reverse = e.data.reverse;
            var r=transform();
            if(index==text.length) {
                postMessage({method:"result",result:r,text});
            }
            break;
        case "pinyin":
            text[index][1]=e.data.pinyin;
            var r=transform();
            if(index==text.length) {
                postMessage({method:"result",result:r,text});
            }
            break;
    }
})