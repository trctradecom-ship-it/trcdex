const ICO = "0xA6F33c57891E52258d68BC99c593207E5C1B4a51";
const TRC = "0xc08983be707bf4b763e7A0f3cCAD3fd00af6620d";

let provider, signer, ico, trc, user;

const icoABI = [
"function usdPrice() view returns(uint256)",
"function getLatestPrice() view returns(uint256)",
"function buy() payable",
"function sell(uint256)",
"function getLastSellTime(address) view returns(uint256)",
"function SELL_COOLDOWN() view returns(uint256)"
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

loadData();

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

updateChart(trcPrice);

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

let tx=await trc.approve(
ICO,
ethers.constants.MaxUint256
);

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



// MAX SELL (1%)

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



// COOLDOWN TIMER

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
// CHART
// =======================

const chartContainer = document.getElementById("chart");
const chart = LightweightCharts.createChart(chartContainer,{
width: chartContainer.clientWidth,
height: 400,

layout:{
background:{color:"#111"},
textColor:"#DDD"}
,

grid:{
vertLines:{color:"#222"},
horzLines:{color:"#222"}
},

timeScale:{
timeVisible:true,
secondsVisible:false,
rightBarStaysOnScroll:true
},

rightPriceScale:{
autoScale:true,
scaleMargins:{
top:0.25,
bottom:0.25
}
}

});


const series = chart.addLineSeries({
color:"#00eaff",
lineWidth:3
});


// keep chart fitted
chart.timeScale().fitContent();

let lastPrice = 0;

// UPDATE CHART

function updateChart(price){

price = Number(price);

let now = Math.floor(Date.now()/1000);

if(lastPrice === 0){
lastPrice = price;
}

let smoothPrice = lastPrice + (price - lastPrice) * 0.05;

series.update({
time: now,
value: smoothPrice
});

lastPrice = smoothPrice;

}





// AUTO REFRESH

setInterval(()=>{

if(user) loadData();

},60000);


window.addEventListener("resize", () => {
  chart.resize(
    chartContainer.clientWidth,
    chartContainer.clientHeight
  );
});


// =======================
// 🔥 ADVANCED CHART ADD-ON (DO NOT REMOVE OLD)
// =======================

// NEW SERIES (candles, volume, EMA)
const candleSeries = chart.addCandlestickSeries();
const volumeSeries = chart.addHistogramSeries({
  priceFormat: { type: 'volume' },
  priceScaleId: 'volume', // ✅ separate panel
  color: '#26a69a'
});

// ✅ MOVE VOLUME TO BOTTOM
chart.priceScale('volume').applyOptions({
  scaleMargins: {
    top: 0.8,
    bottom: 0
  }
});

chart.priceScale('volume').applyOptions({
  scaleMargins: {
    top: 0.8,
    bottom: 0
  }
});

volumeSeries.priceScale().applyOptions({
  scaleMargins: { top: 0.8, bottom: 0 }
});

// EMA LINES
const ema20Series = chart.addLineSeries({ color: "#00eaff", lineWidth: 2 });
const ema50Series = chart.addLineSeries({ color: "#ffaa00", lineWidth: 2 });
const ema200Series = chart.addLineSeries({ color: "#ff00ff", lineWidth: 2 });

// DEFAULT SETTINGS
let candles = [];
let currentTF = 3600; // 1H default
let lastCandleTime = 0;

let showEMA20 = true;
let showEMA50 = false;
let showEMA200 = false;


// =======================
// TIMEFRAME SWITCH
// =======================

function setTimeframe(tf){

document.querySelectorAll(".tf-group button")
.forEach(btn => btn.classList.remove("active"));

event.target.classList.add("active");

const map = {
"5m":300,
"15m":900,
"30m":1800,
"1h":3600,
"4h":14400,
"1d":86400,
"1w":604800
};

currentTF = map[tf];
candles = [];
lastCandleTime = 0;

}


// =======================
// EMA TOGGLE
// =======================

function toggleEMA(type){

event.target.classList.toggle("active");

if(type===20) showEMA20=!showEMA20;
if(type===50) showEMA50=!showEMA50;
if(type===200) showEMA200=!showEMA200;

}


// =======================
// EMA CALC
// =======================

function calcEMA(period){

let k = 2/(period+1);
let ema=[];

candles.forEach((c,i)=>{
if(i===0){
ema.push(c.close);
}else{
ema.push(c.close*k + ema[i-1]*(1-k));
}
});

return ema;
}


// =======================
// 🔁 ADVANCED UPDATE (HOOK)
// =======================

// SAVE OLD FUNCTION
const oldUpdateChart = updateChart;

// OVERRIDE FUNCTION
updateChart = function(price){

// call old line chart
oldUpdateChart(price);

// NOW CANDLE LOGIC
price = Number(price);

let now = Math.floor(Date.now()/1000);
let bucket = Math.floor(now/currentTF)*currentTF;

if(bucket !== lastCandleTime){

let prev = candles.length ? candles[candles.length-1].close : price;

// SMALL GREEN DUMMY START
let candle = {
time: bucket,
open: prev,
high: price,
low: price,
close: price
};

candles.push(candle);
candleSeries.update(candle);

volumeSeries.update({
time: bucket,
value: Math.random()*50
});

lastCandleTime = bucket;

}else{

let c = candles[candles.length-1];

c.high = Math.max(c.high, price);
c.low = Math.min(c.low, price);
c.close = price;

candleSeries.update(c);

volumeSeries.update({
time: bucket,
value: Math.random()*50
});
}


// EMA UPDATE
if(showEMA20){
let ema = calcEMA(20);
ema20Series.setData(candles.map((c,i)=>({time:c.time,value:ema[i]})));
}else ema20Series.setData([]);

if(showEMA50){
let ema = calcEMA(50);
ema50Series.setData(candles.map((c,i)=>({time:c.time,value:ema[i]})));
}else ema50Series.setData([]);

if(showEMA200){
let ema = calcEMA(200);
ema200Series.setData(candles.map((c,i)=>({time:c.time,value:ema[i]})));
}else ema200Series.setData([]);

};


// =======================
// 🟢 DUMMY CANDLES EVERY 5 MIN
// =======================

setInterval(()=>{

if(!user) return;

let last = candles.length
? candles[candles.length-1].close
: 1;

// SIDEWAYS SMALL GREEN MOVE
let price = last * (1 + (Math.random()*0.0005));

updateChart(price);

},300000); // 5 min

