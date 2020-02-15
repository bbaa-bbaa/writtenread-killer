const mdui = require("mdui");
import 'mdui/dist/css/mdui.min.css';
window.$$ = mdui.JQ;
import Worker from './main.worker.js';
import Clipboard from 'clipboard';
const Copy = new Clipboard('#copy');
Copy.on('success', function(e) {
    mdui.snackbar({message:"复制成功",buttonText:"好的"})
});
Copy.on('error', function(e) {
    mdui.snackbar({message:"复制失败",buttonText:"好的"})
});
let worker = new Worker();
let text=[];
let str="";
let dialogCloseId=null;
let dialog = new mdui.Dialog(".mdui-dialog", {
    history:false,
    modal:true,
    closeOnEsc:false,
    closeOnConfirm:false
});
if(localStorage.getItem("data")){
    let data=JSON.parse(localStorage.getItem("data"));
    $$("#usedhans").val(data.usedhans);
    $$("#reverse").prop("checked",data.reverse);
    $$("#input").val(data.text.map(a => a[0]).join(''))
    $$("#output").val(data.result)
    text=data.text;
}
$$(".mdui-dialog").on("confirm.mdui.dialog",(e)=>{
    worker.postMessage({method:"pinyin",pinyin:$$("input[name='pinyin']:checked").val()});
    dialogCloseId=setTimeout(()=>{
        dialog.close();
    },350);
})
function genRadio(list){
    $$("#radio").html("");
    let id=0;
    for (let value of Object.values(list)){
        let label = document.createElement("label");
        label.classList.add("mdui-radio");
        let radio =document.createElement("input");
        radio.setAttribute("type","radio");
        radio.setAttribute("name","pinyin");
        radio.setAttribute("value",value);
        if(!id) {radio.checked=true;}
        let i=document.createElement("i");
        i.setAttribute("class","mdui-radio-icon");
        label.append(radio);
        label.append(i)
        label.append(value)
        $$("#radio").append(label);
        $$("#radio").append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;")
        id++;
    }
}
worker.addEventListener("message",(e)=>{
    switch (e.data.method) {
        case "choicePinyin":
            if($$("#auto-choice").prop("checked")) {
                worker.postMessage({method:"pinyin",pinyin:e.data.list[0]});
                break;
            }
            if(dialogCloseId !== null) clearTimeout(dialogCloseId);
            $$("#text").html(str.substr(0,e.data.index)+"<span style=\"color:red;\">"+str.substr(e.data.index,1)+"</span>"+str.substr(e.data.index+1))
            genRadio(e.data.list);
            dialog.open();
            break;
        case "result":
            localStorage.setItem("data",JSON.stringify({
                usedhans:Number($$("#usedhans").val()),
                result:e.data.result,
                reverse:$$("#reverse").prop("checked"),
                text:e.data.text
            }))
            $$("#output").val(e.data.result);
            text=e.data.text;
    }
})
$$("#clear").on("click", () => {
    $$("#input").val("");
    $$("#output").val("");
});
$$("#gogogo").on("click", () => {
    str = $$("#input").val();
    if(str.length!=text.length) {
        worker.postMessage({method:"transform",text:[...str].map(value=>[value]),usedhans:(Number($$("#usedhans").val()) / 100),reverse:$$("#reverse").prop("checked")});
    } else if(str.length!=0) {
        if(text.every(((v,i) => {
            return v[0] == str[i];
        }))){
            worker.postMessage({method:"transform",text:text,usedhans:(Number($$("#usedhans").val()) / 100),reverse:$$("#reverse").prop("checked")});
        } else {
            worker.postMessage({method:"transform",text:[...str].map(value=>[value]),usedhans:(Number($$("#usedhans").val()) / 100),reverse:$$("#reverse").prop("checked")});
        }
    }
})
$$("#reverse").on("change", () => {
    $$("#tip").text($$("#reverse").prop("checked") ? "从汉字使用频率高向低取" : "从汉字使用频率低向高取")
})