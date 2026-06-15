const chatfield = document.querySelector(".chat #chatfield #messages");
const sendbutton = document.querySelector(".chat #inputs #sendbutton");
const sendfield = document.querySelector(".chat #inputs #sendfield");
const usernamefield = document.querySelector(".chat #inputs #username");
const usercount = document.querySelector("#count");

const customProtocol = "secretprotocol";

/*

types:
'join'
'message'
'left'
'setusername'
*/
// лист с разными именами
const randomNames = ["John", "Sasha", "Chelovek", "Mint", "MintLover", "Alex", "Myata", "Man", "Woman", "Sous"];
let ws;
let username;

function Randomizer(min, max) {
    return Math.floor(Math.random() * (max-min+1)) + min;
}

function RandomColor(min, max) {
    return `rgb(${Randomizer(min, max)},${Randomizer(min, max)},${Randomizer(min, max)})`;
}

// написать в чат
function writeMessage(message) {
    const elementli = document.createElement("li");
    const elementp = document.createElement('p');

    elementp.textContent = message;

    
    chatfield.appendChild(elementli);
    elementli.appendChild(elementp);
    document.querySelector('.chat #chatfield').scrollTo(0, document.querySelector('.chat #chatfield').scrollHeight)
    return elementp;
}

// написать от лица сервера
function writeSystemMessage(message) {
    const div = writeMessage(message);

    div.id = "system"
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
    const saveduser = JSON.parse(localStorage.getItem('user'));
    if (saveduser == undefined) {
        pickingname();
    } else {
        username = saveduser.username;
    }

    function pickingname() {
        let userprompt = prompt("TYPE YOUR NAME (its impossible to change your name later!):", "");
        if (userprompt) {
            if (userprompt.length < 20) {
                localStorage.setItem('user', JSON.stringify({ username: userprompt }))
                username = userprompt;
            } else {
                alert("name is too long, consider picking name with less than 20 characters");
                pickingname();
            }
        } else {
            alert("no name has choosen, consider picking new name");
            pickingname();
        };
    }

    usernamefield.value = username;
    console.log(username);
    sendToWSServer("setusername", 
        {"username": username}
    )
    sendToWSServer("join", 
        {}
    )
}
// информация с WSServer
function onMessage(event) {
    const data = JSON.parse(event.data);
    const message = data.payload.message;
    const name = data.payload.username;

    switch (data.type) {
        case "join":
            writeSystemMessage(name + " has joined the chat")
            usercount.textContent = "users in chat: " + message;
            break;
        case "message":
            writeMessage(name + ": " + message)
            break;
        case "left":
            writeSystemMessage(name + " has left the chat")
            usercount.textContent = "users in chat: " + message;
            break;
    }
}

// добавляем задержку в 1 секунду чтобы люди не отправляли слишком много сообщений в секунду
const sleep = ms => new Promise(r => setTimeout(r, ms));
let readytosend = true;

async function UIMessage() {
    readytosend = false;

    const message = sendfield.value;

    if (message == '' || message.length > 100) {
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
    
    ws = new WebSocket("ws://" + ourURL.host, customProtocol);

    ws.addEventListener('open', onOpen)
    ws.addEventListener('message', onMessage)
    ws.addEventListener('close',  () => {writeSystemMessage("Connection Error")})
    ws.addEventListener('error', () => {writeSystemMessage("Connection Error")})
})