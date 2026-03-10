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


// LOAD ALL DATA

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

let amount=document.getElementById("buyAmount").value;

let tx=await ico.buy({
value:ethers.utils.parseEther(amount)
});

document.getElementById("status").innerText="Buying...";

await tx.wait();

document.getElementById("status").innerText="Buy success";

loadData();

}


// APPROVE

async function approveTRC(){

let tx=await trc.approve(
ICO,
ethers.constants.MaxUint256
);

document.getElementById("status").innerText="Approving...";

await tx.wait();

document.getElementById("status").innerText="Approved";

}


// SELL

async function sellTRC(){

let amount=document.getElementById("sellAmount").value;

let tx=await ico.sell(
ethers.utils.parseEther(amount)
);

document.getElementById("status").innerText="Selling...";

await tx.wait();

document.getElementById("status").innerText="Sell success";

loadData();

}


// MAX SELL (1%)

async function maxSell(){

let trcBal=await trc.balanceOf(user);

let onePercent=trcBal.div(100);

let price=await ico.usdPrice();

let polPrice=await ico.getLatestPrice();

let usdValue=onePercent.mul(price).div(ethers.utils.parseUnits("1",18));

let pol=usdValue.mul(1e8).div(polPrice);

document.getElementById("sellAmount").value=
ethers.utils.formatEther(pol);

}


// COOLDOWN TIMER

async function loadCooldown(){

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


// CHART

const chart = LightweightCharts.createChart(
document.getElementById("chart"),
{height:400}
);

const series = chart.addLineSeries();

let data=[];
let t=1;

function updateChart(price){

data.push({time:t,value:price});
series.setData(data);
t++;

}


// AUTO REFRESH

setInterval(()=>{

if(user) loadData();

},10000);
