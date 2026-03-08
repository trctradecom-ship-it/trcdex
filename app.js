const CONTRACT_ADDRESS="0xA6F33c57891E52258d68BC99c593207E5C1B4a51"

const ABI=[

"function buy() payable",
"function sell(uint256)",
"function getLatestPrice() view returns(uint256)",
"function usdPrice() view returns(uint256)",
"function token() view returns(address)",
"function getLastSellTime(address) view returns(uint256)",

"event TokensPurchased(address buyer,uint256 polPaid,uint256 tokensReceived)",
"event TokensSold(address seller,uint256 tokensSold,uint256 polReceived)"

]

const ERC20_ABI=[

"function balanceOf(address) view returns(uint256)"

]

let provider
let signer
let contract
let tokenContract
let wallet

const connectBtn=document.getElementById("connectBtn")

connectBtn.onclick=connectWallet

async function connectWallet(){

if(!window.ethereum){

alert("Open inside wallet browser")

return

}

provider=new ethers.BrowserProvider(window.ethereum)

await provider.send("eth_requestAccounts",[])

signer=await provider.getSigner()

wallet=await signer.getAddress()

contract=new ethers.Contract(CONTRACT_ADDRESS,ABI,signer)

connectBtn.innerText=wallet.slice(0,6)+"..."+wallet.slice(-4)

const tokenAddress=await contract.token()

tokenContract=new ethers.Contract(tokenAddress,ERC20_ABI,provider)

loadBalance()

loadPrices()

loadHistory()

}

async function loadBalance(){

const bal=await tokenContract.balanceOf(wallet)

document.getElementById("trcBalance").innerText=
ethers.formatUnits(bal,18)

}

async function loadPrices(){

const trc=await contract.getLatestPrice()

const pol=await contract.usdPrice()

document.getElementById("trcPrice").innerText="$"+ethers.formatUnits(trc,18)

document.getElementById("polPrice").innerText="$"+ethers.formatUnits(pol,18)

updateChart(parseFloat(ethers.formatUnits(trc,18)))

}

setInterval(loadPrices,5000)

document.getElementById("buyBtn").onclick=buy

async function buy(){

try{

const val=document.getElementById("buyAmount").value

document.getElementById("status").innerText="Buying..."

const tx=await contract.buy({
value:ethers.parseEther(val)
})

await tx.wait()

document.getElementById("status").innerText="Buy confirmed"

loadBalance()

}catch(e){

document.getElementById("status").innerText="Failed"

}

}

document.getElementById("sellBtn").onclick=sell

async function sell(){

try{

const val=document.getElementById("sellAmount").value

document.getElementById("status").innerText="Selling..."

const tx=await contract.sell(
ethers.parseEther(val)
)

await tx.wait()

document.getElementById("status").innerText="Sell confirmed"

loadBalance()

}catch(e){

document.getElementById("status").innerText="Failed"

}

}

async function loadHistory(){

contract.on("TokensPurchased",(buyer,pol,tokens)=>{

addHistory("BUY "+ethers.formatUnits(tokens,18)+" TRC")

})

contract.on("TokensSold",(seller,tokens,pol)=>{

addHistory("SELL "+ethers.formatUnits(tokens,18)+" TRC")

})

}

function addHistory(text){

const div=document.createElement("div")

div.className="tradeItem"

div.innerText=text

document.getElementById("history").prepend(div)

}

let chartData=[]

const canvas=document.getElementById("priceChart")

const ctx=canvas.getContext("2d")

function updateChart(price){

chartData.push(price)

if(chartData.length>40) chartData.shift()

ctx.clearRect(0,0,canvas.width,canvas.height)

ctx.beginPath()

ctx.strokeStyle="#0ecb81"

for(let i=0;i<chartData.length;i++){

let x=i*10

let y=200-chartData[i]*100

if(i==0) ctx.moveTo(x,y)
else ctx.lineTo(x,y)

}

ctx.stroke()

}
