const CONTRACT_ADDRESS="0xA6F33c57891E52258d68BC99c593207E5C1B4a51" 

const ABI=[

"function trcPrice() view returns(uint256)",
"function polPrice() view returns(uint256)",
"function buyTokens() payable",
"function sellTokens(uint256)",
"function balanceOf(address) view returns(uint256)"

]

let provider
let signer
let contract
let wallet

let lastSell=0

const connectBtn=document.getElementById("connectBtn")
const buyBtn=document.getElementById("buyBtn")
const sellBtn=document.getElementById("sellBtn")

connectBtn.onclick=connectWallet
buyBtn.onclick=buy
sellBtn.onclick=sell

async function connectWallet(){

if(!window.ethereum){

alert("Install wallet")

return

}

provider=new ethers.BrowserProvider(window.ethereum)

await provider.send("eth_requestAccounts",[])

signer=await provider.getSigner()

wallet=await signer.getAddress()

contract=new ethers.Contract(CONTRACT_ADDRESS,ABI,signer)

connectBtn.innerText=wallet.slice(0,6)+"..."+wallet.slice(-4)

loadPrices()

}

async function loadPrices(){

try{

const trc=await contract.trcPrice()
const pol=await contract.polPrice()

document.getElementById("trcPrice").innerText="$"+ethers.formatUnits(trc,18)

document.getElementById("polPrice").innerText="$"+ethers.formatUnits(pol,18)

}catch(e){}

}

setInterval(loadPrices,5000)

async function buy(){

try{

const value=document.getElementById("amount").value

document.getElementById("status").innerText="Transaction sending..."

const tx=await contract.buyTokens({
value:ethers.parseEther(value)
})

await tx.wait()

document.getElementById("status").innerText="Buy successful"

}catch(e){

document.getElementById("status").innerText="Transaction failed"

}

}

async function sell(){

const now=Math.floor(Date.now()/1000)

if(now<lastSell+86400){

alert("24h cooldown active")

return

}

try{

const amount=document.getElementById("amount").value

document.getElementById("status").innerText="Selling..."

const tx=await contract.sellTokens(
ethers.parseUnits(amount,18)
)

await tx.wait()

lastSell=now

document.getElementById("status").innerText="Sell successful"

}catch(e){

document.getElementById("status").innerText="Transaction failed"

}

}

function updateTimer(){

if(lastSell===0)return

const now=Math.floor(Date.now()/1000)

let remain=(lastSell+86400)-now

if(remain<=0){

document.getElementById("countdown").innerText="Available"

return

}

let h=Math.floor(remain/3600)
let m=Math.floor((remain%3600)/60)
let s=remain%60

document.getElementById("countdown").innerText=
h+"h "+m+"m "+s+"s"

}

setInterval(updateTimer,1000)
