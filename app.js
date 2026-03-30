const ICO = "0xA6F33c57891E52258d68BC99c593207E5C1B4a51";
const TRC = "0xc08983be707bf4b763e7A0f3cCAD3fd00af6620d";

let provider, signer, ico, trc, user;

const icoABI = [
"function usdPrice() view returns(uint256)",
"function getLatestPrice() view returns(uint256)",
"function buy() payable",
"function sell(uint256)",
"function getLastSellTime(address) view returns(uint256)",
"function SELL_COOLDOWN() view returns(uint256)",
"event TokensPurchased(address,uint256,uint256)",
"event TokensSold(address,uint256,uint256)"
];

const erc20ABI = [
"function balanceOf(address) view returns(uint256)",
"function approve(address,uint256) returns(bool)",
"function allowance(address,address) view returns(uint256)"
];

// CONNECT WALLET
async function connectWallet(){

await ethereum.request({method:'eth_requestAccounts'});

provider = new ethers.providers.Web3Provider(window.ethereum);
signer = provider.getSigner();

user = await signer.getAddress();

document.getElementById("walletAddress").innerText = user;

ico = new ethers.Contract(ICO, icoABI, signer);
trc = new ethers.Contract(TRC, erc20ABI, signer);

await loadData();
await loadInitialChart();
setupEventListeners();

}

// LOAD DATA
async function loadData(){

let trcBal = await trc.balanceOf(user);
let polBal = await provider.getBalance(user);

let trcPrice = await ico.usdPrice();
let polPrice = await ico.getLatestPrice();

trcBal = Number(ethers.utils.formatUnits(trcBal,18));
polBal = Number(ethers.utils.formatEther(polBal));
trcPrice = Number(ethers.utils.formatUnits(trcPrice,18));
polPrice = Number(polPrice)/1e8;

document.getElementById("trcBalance").innerText = trcBal.toFixed(4);
document.getElementById("polBalance").innerText = polBal.toFixed(4);

document.getElementById("trcPrice").innerText = "$"+trcPrice.toFixed(2);
document.getElementById("polPrice").innerText = "$"+polPrice.toFixed(2);

document.getElementById("trcValue").innerText =
"$"+(trcBal*trcPrice).toFixed(2);

loadCooldown();

}

// BUY
async function buyTRC(){
try{
let amount=document.getElementById("buyAmount").value;
document.getElementById("status").innerText="Transaction Sending...";

let tx=await ico.buy({
value:ethers.utils.parseEther(amount)
});

document.getElementById("status").innerText="Transaction Pending...";
let receipt = await tx.wait();

if(receipt.status===1){
document.getElementById("status").innerText="Transaction Success";
loadData();
}else{
document.getElementById("status").innerText="Transaction Failed";
}
}catch(e){
document.getElementById("status").innerText="Transaction Failed";
}
}

// APPROVE
async function approveTRC(){
try{
document.getElementById("status").innerText="Approval Sending...";

let tx=await trc.approve(ICO,ethers.constants.MaxUint256);

document.getElementById("status").innerText="Approval Pending...";
let receipt = await tx.wait();

if(receipt.status===1){
document.getElementById("status").innerText="Approval Success";
}else{
document.getElementById("status").innerText="Approval Failed";
}
}catch(e){
document.getElementById("status").innerText="Approval Failed";
}
}

// SELL
async function sellTRC(){
try{
let amount=document.getElementById("sellAmount").value;

document.getElementById("status").innerText="Transaction Sending...";

let tx=await ico.sell(
ethers.utils.parseEther(amount)
);

document.getElementById("status").innerText="Transaction Pending...";
let receipt = await tx.wait();

if(receipt.status===1){
document.getElementById("status").innerText="Transaction Success";
loadData();
}else{
document.getElementById("status").innerText="Transaction Failed";
}
}catch(e){
document.getElementById("status").innerText="Transaction Failed";
}
}

// MAX SELL
async function maxSell(){

let trcBal = await trc.balanceOf(user);
let maxTRC = trcBal.div(100);

let trcPrice = await ico.usdPrice();
trcPrice = Number(ethers.utils.formatUnits(trcPrice,18));

let polPrice = await ico.getLatestPrice();
polPrice = Number(polPrice)/1e8;

let maxTRCReadable =
Number(ethers.utils.formatUnits(maxTRC,18));

let usdValue = maxTRCReadable * trcPrice;

let polAmount;

if(usdValue < 1){
polAmount = 1 / polPrice;
}else{
polAmount = usdValue / polPrice;
}

document.getElementById("sellAmount").value =
polAmount.toFixed(4);

}

// COOLDOWN
let cooldownStarted=false;

async function loadCooldown(){

if(cooldownStarted) return;

cooldownStarted=true;

let last=await ico.getLastSellTime(user);
let cd=await ico.SELL_COOLDOWN();

let next=Number(last)+Number(cd);

setInterval(()=>{

let now=Math.floor(Date.now()/1000);
let left=next-now;

if(left<=0){
document.getElementById("cooldown").innerText="Ready";
return;
}

let h=Math.floor(left/3600);
let m=Math.floor((left%3600)/60);
let s=left%60;

document.getElementById("cooldown").innerText=
h+"h "+m+"m "+s+"s";

},1000);

}

// =======================
// CHART (FINAL FIX)
// =======================

const chartContainer = document.getElementById("chart");

const chart = LightweightCharts.createChart(chartContainer,{
width: chartContainer.clientWidth,
height: 400,
layout:{ background:{color:"#111"}, textColor:"#DDD"},
grid:{ vertLines:{color:"#222"}, horzLines:{color:"#222"}},
timeScale:{ timeVisible:true },
rightPriceScale:{ autoScale:true }
});

const series = chart.addLineSeries({
color:"#00eaff",
lineWidth:3
});

let chartData = [];

// INITIAL LOAD
async function loadInitialChart(){

let price = await ico.usdPrice();
price = Number(ethers.utils.formatUnits(price,18));

let now = Math.floor(Date.now()/1000);

for(let i=50;i>0;i--){
chartData.push({ time: now - i*60, value: price });
}

series.setData(chartData);
}

// PUSH PRICE
async function pushChartPrice(){

try{
let price = await ico.usdPrice();
price = Number(ethers.utils.formatUnits(price,18));

let now = Math.floor(Date.now()/1000);

chartData.push({ time: now, value: price });

if(chartData.length > 300) chartData.shift();

series.setData(chartData);

}catch(e){}
}

// EVENTS
function setupEventListeners(){

ico.on("TokensPurchased", async ()=>{
await pushChartPrice();
await loadData();
});

ico.on("TokensSold", async ()=>{
await pushChartPrice();
await loadData();
});

}

// GLOBAL SYNC
setInterval(()=>{
if(ico) pushChartPrice();
},10000);

// DASHBOARD REFRESH
setInterval(()=>{
if(user) loadData();
},60000);

// RESIZE
window.addEventListener("resize", () => {
chart.resize(chartContainer.clientWidth,400);
});
