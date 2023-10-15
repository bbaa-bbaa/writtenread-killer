const mdui = require("mdui");
import 'mdui/dist/css/mdui.min.css';
const $$ = mdui.JQ;
import Worker from './main.worker.js';
import Clipboard from 'clipboard';
const Copy = new Clipboard('#copy');
Copy.on('success', function (e) {
    mdui.snackbar({ message: "复制成功", buttonText: "好的" })
});
Copy.on('error', function (e) {
    mdui.snackbar({ message: "复制失败", buttonText: "好的" })
});
let worker = new Worker();
let text = [];
let str = "";
let splitStr=[];
let dialogCloseId = null;
let dialog = new mdui.Dialog(".mdui-dialog", {
    history: false,
    modal: true,
    closeOnEsc: false,
    closeOnConfirm: false
});
if (localStorage.getItem("data")) {
    let data = JSON.parse(localStorage.getItem("data"));
    $$("#usedhans").val(data.usedhans);
    $$("#reverse").prop("checked", data.reverse);
    $$("#input").val(data.text.map(a => a[0]).join(''));
    $$("#output").val(data.result);
    $$("#auto-choice").prop("checked",data.auto || false);
    text = data.text;
}
$$(".mdui-dialog").on("confirm.mdui.dialog", (e) => {
    worker.postMessage({ method: "pinyin", pinyin: $$("input[name='pinyin']:checked").val() });
    dialogCloseId = setTimeout(() => {
        dialog.close();
    }, 350);
})
function genRadio(list) {
    $$("#radio").html("");
    let id = 0;
    let row = "";
    for (let value of Object.values(list)) {
        if (id % 4 == 0) {
            row = document.createElement("div");
            row.classList.add("mdui-row");
            $$("#radio").append(row);
        }
        let container = document.createElement("div");
        container.classList.add("mdui-col-xs-3")
        let label = document.createElement("label");
        label.classList.add("mdui-radio");
        let radio = document.createElement("input");
        radio.setAttribute("type", "radio");
        radio.setAttribute("name", "pinyin");
        radio.setAttribute("value", value);
        if (!id) { radio.checked = true; }
        let i = document.createElement("i");
        i.setAttribute("class", "mdui-radio-icon");
        label.append(radio);
        label.append(i)
        label.append(value)
        container.append(label);
        row.append(container);
        id++;
    }
    dialog.handleUpdate();
}
worker.addEventListener("message", (e) => {
    switch (e.data.method) {
        case "choicePinyin":
            if ($$("#auto-choice").prop("checked")) {
                worker.postMessage({ method: "pinyin", pinyin: e.data.list[0] });
                break;
            }
            if (dialogCloseId !== null) clearTimeout(dialogCloseId);
            $$("#text").html(splitStr.slice(0,e.data.index).join("") + "<span style=\"color:red;\">" + splitStr[e.data.index] + "</span>" + splitStr.slice(e.data.index + 1).join(""))
            genRadio(e.data.list);
            dialog.open();
            break;
        case "result":
            localStorage.setItem("data", JSON.stringify({
                usedhans: Number($$("#usedhans").val()),
                result: e.data.result,
                reverse: $$("#reverse").prop("checked"),
                text: e.data.text,
                auto:$$("#auto-choice").prop("checked")
            }))
            $$("#gogogo").prop("disabled",false);
            $$("#p").css("width","100%");
            $$("#output").val(e.data.result);
            text = e.data.text;
        case "p":
            $$("#p").css("width",e.data.p*100+"%");
            break;
    }
})
$$("#clear").on("click", () => {
    $$("#input").val("");
    $$("#output").val("");
});
$$("#gogogo").on("click", () => {
    if($$("#gogogo").prop("disabled")) return;
    $$("#gogogo").prop("disabled",true)
    str = $$("#input").val();
    splitStr=[...str];
    $$("#p").css("width","0%");
    if (str.length != text.length) {
        worker.postMessage({ method: "transform", text: splitStr.map(value => [value]), usedhans: (Number($$("#usedhans").val()) / 100), reverse: $$("#reverse").prop("checked") });
    } else if (str.length != 0) {
        if (text.every(((v, i) => {
            return v[0] == splitStr[i];
        }))) {
            worker.postMessage({ method: "transform", text: text, usedhans: (Number($$("#usedhans").val()) / 100), reverse: $$("#reverse").prop("checked") });
        } else {
            worker.postMessage({ method: "transform", text: splitStr.map(value => [value]), usedhans: (Number($$("#usedhans").val()) / 100), reverse: $$("#reverse").prop("checked") });
        }
    }
})
$$("#reverse").on("change", () => {
    $$("#tip").text($$("#reverse").prop("checked") ? "从汉字使用频率高向低取" : "从汉字使用频率低向高取")
})
