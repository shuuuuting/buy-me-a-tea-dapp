import abi from "../utils/BuyMeATea.json"
import { ethers } from "ethers"
import Head from "next/head"
import React, { useEffect, useState } from "react"
import styles from "../styles/Home.module.css"

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0xd0e6cd03e98f61a4ee3b666115c9b8d9b3c98096"
  const contractABI = abi.abi

  // Component state
  const [currentAccount, setCurrentAccount] = useState("")
  const [contract, setContract] = useState(null)
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [memos, setMemos] = useState([])

  const connectWallet = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        console.log("Please install MetaMask")
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts"
      })

      setCurrentAccount(accounts[0])
    } catch (error) {
      console.log(error)
    }
  }

  const initialize = async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        await ethereum.request({ method: "eth_requestAccounts" })
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        setContract(new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )
        )
      }

    } catch (error) {
      console.log(error)
    }
  }

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      if (contract) {
        console.log("Fetching memos from the blockchain..")
        const memos = await contract.getMemos()
        console.log("Fetched!")
        setMemos(memos)
      } else {
        console.log("Metamask is not connected")
      }

    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    getMemos()

    // Create an event handler function 
    // when someone sends new memo
    const handleNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message)
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp,
          message,
          name
        }
      ])
    }

    // Listen for new memo events.
    if (contract) {
      contract.on("NewMemo", handleNewMemo)
    }

    return () => {
      if (contract)
        contract.off("NewMemo", handleNewMemo)
    }
  }, [contract])


  const handleNameChange = (event) => {
    setName(event.target.value)
  }

  const handleMessageChange = (event) => {
    setMessage(event.target.value)
  }

  const handleBuy = async () => {
    try {
      if (contract) {
        console.log("Buying tea...")
        const teaTrans = await contract.buyTea(
          name ? name : "Anonymity",
          message ? message : "Enjoy your tea!",
          { value: ethers.utils.parseEther("0.001") }
        )

        await teaTrans.wait()

        console.log("Mined ", teaTrans.hash)

        console.log("Tea purchased!")

        // Clear the form fields.
        setName("")
        setMessage("")
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Buy a Tea!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Buy a Tea!
        </h1>

        {currentAccount ? (
          <div>
            <form>
              <div>
                <label>
                  Name
                </label>
                <br />

                <input
                  id="name"
                  type="text"
                  placeholder="Anonymity"
                  onChange={handleNameChange}
                />
              </div>
              <br />
              <div>
                <label>
                  Send Albert a message
                </label>
                <br />

                <textarea
                  rows={3}
                  placeholder="Enjoy your tea!"
                  id="message"
                  onChange={handleMessageChange}
                  required
                >
                </textarea>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleBuy}
                >
                  Send 1 Tea for 0.001ETH
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={connectWallet}> Connect your wallet </button>
        )}
      </main>

      {currentAccount && (<h1>Memos received</h1>)}

      {currentAccount && (memos.map((memo, idx) => {
        return (
          <div key={idx} style={{ border: "2px solid", "borderRadius": "5px", padding: "5px", margin: "5px" }}>
            <p style={{ "fontWeight": "bold" }}>"{memo.message}"</p>
            <p>From: {memo.name} at {Date(memo.timestamp).toString()}</p>
          </div>
        )
      }))}
    </div>
  )
}
