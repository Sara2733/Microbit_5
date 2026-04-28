let device = null;
let server = null;
let uartRX = null; // scrittura verso microbit
let uartTX = null; // lettura dal microbit

let x = 0;
let y = 0;
let z = 0;

let stabilityTime = 0;
let movementTime = 0;
let currentMovement = "Fermo";

let interval = null;

// UUID UART micro:bit
const UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const UART_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

async function connectMicrobit() {
  try {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [UART_SERVICE]
    });

    device.addEventListener(
      'gattserverdisconnected',
      onDisconnected
    );

    server = await device.gatt.connect();

    const service =
      await server.getPrimaryService(UART_SERVICE);

    uartRX =
      await service.getCharacteristic(UART_RX);

    uartTX =
      await service.getCharacteristic(UART_TX);

    await uartTX.startNotifications();

    uartTX.addEventListener(
      'characteristicvaluechanged',
      handleData
    );

    document.getElementById("status").textContent =
      "Connesso ✔️";

    document.getElementById("status").style.color =
      "green";

    if (interval) clearInterval(interval);

    interval = setInterval(checkMovement, 1000);

  } catch (error) {
    console.error(error);
    alert("Errore connessione: " + error.message);
  }
}

function disconnectMicrobit() {
  if (device && device.gatt.connected) {
    device.gatt.disconnect();
  }
}

function onDisconnected() {
  document.getElementById("status").textContent =
    "Disconnesso ❌";

  document.getElementById("status").style.color =
    "red";

  if (interval) clearInterval(interval);
}

function handleData(event) {
  const text =
    new TextDecoder()
      .decode(event.target.value)
      .trim();

  const lines = text.split("\n");

  lines.forEach(line => {

    if (line.startsWith("x:")) {
      x = parseInt(line.split(":")[1]);
      document.getElementById("x").textContent = x;
    }

    if (line.startsWith("y:")) {
      y = parseInt(line.split(":")[1]);
      document.getElementById("y").textContent = y;
    }

    if (line.startsWith("z:")) {
      z = parseInt(line.split(":")[1]);
      document.getElementById("z").textContent = z;
    }

  });
}

function checkMovement() {

  let newMovement = "Fermo";

  // corsa = tanti movimenti
  if (Math.abs(x) > 500 && Math.abs(y) > 500) {
    newMovement = "Corsa";
  }

  // destra/sinistra
  else if (Math.abs(x) > 350) {
    newMovement = "Destra/Sinistra";
  }

  // salto
  else if (Math.abs(z) > 1300) {
    newMovement = "Salto";
  }

  else {
    newMovement = "Fermo";
  }

  // timer movimento
  if (newMovement === currentMovement) {
    movementTime++;
  } else {
    currentMovement = newMovement;
    movementTime = 0;
  }

  document.getElementById("movement").textContent =
    currentMovement;

  document.getElementById("moveTime").textContent =
    movementTime;

  // equilibrio
  if (Math.abs(x) < 180 && Math.abs(y) < 180) {
    stabilityTime++;
  } else {
    stabilityTime = 0;
  }

  document.getElementById("timer").textContent =
    stabilityTime;

  if (stabilityTime === 5) {
    sendHeart();
  }
}

async function sendHeart() {
  try {
    if (!uartRX) return;

    const encoder = new TextEncoder();

    await uartRX.writeValue(
      encoder.encode(">heart:<\n")
    );

  } catch (error) {
    console.error(error);
  }
}
