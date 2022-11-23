import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/CoinPortal.json";

const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();

    /*
    * First make sure we have access to the Ethereum object.
    */
    if (!ethereum) {
      console.error("Make sure you have Metamask!");
      return null;
    }

    console.log("We have the Ethereum object", ethereum);
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      return account;
    } else {
      console.error("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};


export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
    const [allCoins, setAllCoins] = useState([]);

  const contractAddress = "0x720eBb5027eCbE42bb90d9cBa4138C98cad4BA06";
  const contractABI = abi.abi;

  const getAllCoins = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const coinPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllCoins method from your Smart Contract
         */
        const coins = await coinPortalContract.getAllCoins();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let coinsCleaned = [];
        coins.forEach(coin => {
          coinsCleaned.push({
            address: coin.sender,
            timestamp: new Date(coin.timestamp * 1000),
            message: coin.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllCoins(coinsCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllCoins();
    } catch (error) {
      console.error(error);
    }
  };
  
  const sendCoin = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const coinPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await coinPortalContract.getTotalCoins();
        console.log("Retrieved total coins count...", count.toNumber());

        const coinTxn = await coinPortalContract.sendCoin("Sending you a coin!");
        console.log("Mining...", coinTxn.hash);

        await coinTxn.wait();
        console.log("Mined -- ", coinTxn.hash);

        count = await coinPortalContract.getTotalCoins();
        console.log("Retrieved total coins count...", count.toNumber());
        getAllCoins()
        
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = () => {
    if(currentAccount) {
      getAllCoins();
    }
  }
  
  useEffect(async () => {
    const account = await findMetaMaskAccount();
    if (account !== null) {
      setCurrentAccount(account);
    }
    checkIfWalletIsConnected();
  }, []);
  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        💰 Hello, Smart Contract World!
        </div>

        <div className="bio">
          I am Syed and I code everything,<br/>
          Connect your Ethereum wallet and send me a coin! It's free.
        </div>

        <button className="waveButton" onClick={sendCoin}>
          Send me a <span style={{color: "orange", fontWeight: "bold"}} >Coin!</span>
        </button>
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {allCoins.map((coin, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {coin.address}</div>
              <div>Time: {coin.timestamp.toString()}</div>
              <div>Message: {coin.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
