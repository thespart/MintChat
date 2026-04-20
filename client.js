const chatfield = document.querySelector(".chat #chatfield #messages");
const sendbutton = document.querySelector(".chat #inputs #sendbutton");
const sendfield = document.querySelector(".chat #inputs #sendfield");
const usernamefield = document.querySelector(".chat #inputs #username");

const customProtocol = "secretprotocol";


/*

types:
'join'
'message'
'left'
'setusername'
*/
// лист с разными именами
const randomNames = ["John", "Sasha", "Chelovek", "Mint", "MintLover", "Alex", "Myata", "Man", "Woman", "Sous"]
let ws;
let username;

function Randomizer(min, max) {
    return Math.floor(Math.random() * (max-min+1)) + min
}

// написать в чат
function writeMessage(message) {
    const elementli = document.createElement("li");
    const elementp = document.createElement('p');

    elementp.textContent = message

    chatfield.appendChild(elementli);
    elementli.appendChild(elementp);
}

function sendToWSServer(type, payload) {
    ws.send(JSON.stringify({
        'type': type,
        'payload': payload,
    }));
}

// метод, позволяющий узнать на каком URL мы сейчас находимся
function parseLocation(url) {
    let a = document.createElement('a');
    a.href = url;

    return a;
}

function onOpen() {
    username = randomNames[Randomizer(0,randomNames.length-1)] + Randomizer(0,100)
    usernamefield.value = username;
    console.log(username)
    sendToWSServer("setusername", 
        {"username": username}
    )
    sendToWSServer("join", 
        {"username": username}
    )
    writeMessage(`You ( ${username} ) have joined the chat`)
}

// информация с WSServer
function onMessage(event) {
    const data = JSON.parse(event.data);
    const message = data.payload.message;
    let name = data.payload.username;
    
    switch (data.type) {
        case "join":
            writeMessage(name + " has joined the chat")
            break;
        case "message":
            writeMessage(name + ": " + message)
            break;
        case "left":
            writeMessage(name + " has left the chat")
            break;
    }
}

// добавляем задержку в 1 секунду чтобы люди не отправляли слишком много сообщений в секунду
const sleep = ms => new Promise(r => setTimeout(r, ms));
let readytosend = true;

async function UIMessage() {
    readytosend = false;

    const message = sendfield.value;

    if (message == '') {
        readytosend = true;
        return;
    }

    sendToWSServer('message', {
        "message": message
    });

    sendfield.value = '';
    await sleep(1000)
    readytosend = true;
}

document.addEventListener('keydown', () => {
    if (readytosend == false) {return;}

    if (event.key === "Enter") {
        UIMessage()
    }
    
})
sendbutton.addEventListener("click",() => {
    if (readytosend == false) {
        return;
    }
    UIMessage();
})

usernamefield.addEventListener("change",(event) => {

    username = event.target.value;
    console.log(username)
    sendToWSServer("setusername", {
        "username": username,
    })
})

// ждем пока клиент полностью загрузится
window.addEventListener("load", () => {
    const ourURL = parseLocation(window.location);

    if (ourURL.protocol == "https:") {
        ws = new WebSocket("wss://" + ourURL.host, customProtocol)
    } else {
        ws = new WebSocket("ws://" + ourURL.host, customProtocol)
    }

    ws.addEventListener('open', onOpen)
    ws.addEventListener('message', onMessage)
    ws.addEventListener('close',  writeMessage("Connection Closed"))
    ws.addEventListener('error', writeMessage("Connection Error"))
})