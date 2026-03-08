// ============================
// IMPORT CHART
// ============================

const chart = LightweightCharts.createChart(document.getElementById('chart'), {
width:700,
height:400,
layout:{
background:{color:'#111'},
textColor:'#DDD'
},
grid:{
vertLines:{color:'#222'},
horzLines:{color:'#222'}
}
});

const candleSeries = chart.addCandlestickSeries();


// ============================
// SAMPLE MARKET DATA
// ============================

let data = [
{time:'2024-01-01',open:100,high:110,low:90,close:105},
{time:'2024-01-02',open:105,high:120,low:100,close:115},
{time:'2024-01-03',open:115,high:130,low:110,close:125},
{time:'2024-01-04',open:125,high:140,low:120,close:135}
];

candleSeries.setData(data);


// ============================
// POLYGON WALLET CONNECTION
// ============================

let provider
let signer
let walletAddress
let contract

// YOUR CONTRACT ADDRESS
const CONTRACT_ADDRESS = "0xYourContractAddressHere"


// SIMPLE ABI
const CONTRACT_ABI = [

"function buy(uint256 amount) payable",

"function sell(uint256 amount)"

]


document.getElementById("connectBtn").onclick = async () => {

if(window.ethereum){

provider = new ethers.providers.Web3Provider(window.ethereum)

await provider.send("eth_requestAccounts",[])

signer = provider.getSigner()

walletAddress = await signer.getAddress()

document.getElementById("walletAddress").innerText = walletAddress

contract = new ethers.Contract(
CONTRACT_ADDRESS,
CONTRACT_ABI,
signer
)

alert("Wallet Connected")

}else{

alert("Install MetaMask")

}

}



// ============================
// BUY FUNCTION
// ============================

document.getElementById("buyBtn").onclick = async () => {

let amount = document.getElementById("amount").value

let price = data[data.length-1].close

try{

let tx = await contract.buy(
ethers.utils.parseUnits(amount,18),
{
value: ethers.utils.parseEther(amount)
}
)

await tx.wait()

addHistory("BUY",amount,price)

autoSellCalc(price)

}catch(e){

console.error(e)
alert("Transaction Failed")

}

}



// ============================
// SELL FUNCTION
// ============================

document.getElementById("sellBtn").onclick = async () => {

let amount = document.getElementById("amount").value

let price = data[data.length-1].close

try{

let tx = await contract.sell(
ethers.utils.parseUnits(amount,18)
)

await tx.wait()

addHistory("SELL",amount,price)

}catch(e){

console.error(e)

alert("Sell Failed")

}

}



// ============================
// AUTO SELL 1%
// ============================

function autoSellCalc(price){

let sell = price * 1.01

document.getElementById("autoSell").innerText = sell.toFixed(4)

}



// ============================
// TRADE HISTORY
// ============================

function addHistory(type,amount,price){

let table = document.querySelector("#history tbody")

let row = table.insertRow()

row.insertCell(0).innerText = type
row.insertCell(1).innerText = amount
row.insertCell(2).innerText = price
row.insertCell(3).innerText = new Date().toLocaleTimeString()

}
